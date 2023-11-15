/* eslint-disable @typescript-eslint/no-non-null-assertion */
import bre, { ethers } from "@nomiclabs/buidler"
import { ExternalContracts, Layer } from "../scripts/common"
import {
    AmmReader,
    ChainlinkL1,
    ClearingHouse,
    ClearingHouseViewer,
    InsuranceFund,
    L2PriceFeed,
    Ark
} from "../types/ethers"
import { ContractWrapperFactory } from "./contract/ContractWrapperFactory"
import { DeployConfig, PriceFeedKey } from "./contract/DeployConfig"
import { AmmInstanceName, ContractName } from "./ContractName"
import { SettingsDao } from "./SettingsDao"
import { SystemMetadataDao } from "./SystemMetadataDao"
import { flatten } from "../scripts/flatten"
import { TASK_COMPILE } from "@nomiclabs/buidler/builtin-tasks/task-names"
import { SRC_DIR } from "../constants"
import { OzContractDeployer } from "./OzContractDeployer"

export type DeployTask = () => Promise<void>

/* eslint-disable no-console */
export class ContractPublisher {
    readonly externalContract: ExternalContracts
    readonly factory: ContractWrapperFactory
    readonly deployConfig: DeployConfig
    protected taskBatchesMap: Record<Layer, DeployTask[][]> = {
        layer1: [ ],
        layer2: [
            // batch 0
            [
                async (): Promise<void> => {
                    console.log("deploy insuranceFund...")
                    await this.factory.create<InsuranceFund>(ContractName.InsuranceFund).deployUpgradableContract()
                },
                async (): Promise<void> => {
                    console.log("deploy ark...")
                    const ark = await this.factory.create<Ark>(ContractName.Ark).deployUpgradableContract()
                    const insuranceFund = await this.factory
                        .create<InsuranceFund>(ContractName.InsuranceFund)
                        .instance()
                    await (await ark.setInsuranceFund(insuranceFund.address!)).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    console.log("deploy L2PriceFeed...")
                    await this.factory
                        .create<L2PriceFeed>(ContractName.L2PriceFeed)
                        .deployUpgradableContract()
                },
                async (): Promise<void> => {
                    console.log("deploy chainlink price feed...")
                    const l2PriceFeedOnXdai = this.systemMetadataDao.getContractMetadata(
                        "layer2",
                        ContractName.L2PriceFeed,
                    ).address
                    await this.factory
                        .create<ChainlinkL1>(ContractName.ChainlinkL1)
                        .deployUpgradableContract(l2PriceFeedOnXdai)
                },
                async (): Promise<void> => {
                    console.log("add chainlink address to L2PriceFeed...")
                    const l2PriceFeed = await this.factory
                        .create<L2PriceFeed>(ContractName.L2PriceFeed)
                        .instance()
                    const chainlinkL1 = await this.factory
                        .create<ChainlinkL1>(ContractName.ChainlinkL1)
                        .instance()
                    await (await l2PriceFeed.setChainlink(chainlinkL1.address!)).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    console.log("deploy clearing house...")
                    const insuranceFundContract = this.factory.create<InsuranceFund>(ContractName.InsuranceFund)
                    await this.factory
                        .create<ClearingHouse>(ContractName.ClearingHouse)
                        .deployUpgradableContract(
                            this.deployConfig.initMarginRequirement,
                            this.deployConfig.maintenanceMarginRequirement,
                            this.deployConfig.liquidationFeeRatio,
                            insuranceFundContract.address!,
                        )
                },
                async (): Promise<void> => {
                    console.log("insuranceFundContract.setBeneficiary...")
                    const clearingHouse = this.factory.create<ClearingHouse>(ContractName.ClearingHouse)
                    const insuranceFund = await this.factory
                        .create<InsuranceFund>(ContractName.InsuranceFund)
                        .instance()
                    await (await insuranceFund.setBeneficiary(clearingHouse.address!)).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    console.log("deploy clearingHouseViewer...")
                    const clearingHouseContract = this.factory.create<ClearingHouse>(ContractName.ClearingHouse)
                    const clearingHouseViewerContract = this.factory.create<ClearingHouseViewer>(
                        ContractName.ClearingHouseViewer,
                    )
                    await clearingHouseViewerContract.deployImmutableContract(clearingHouseContract.address!)
                },
            ],
            // batch 1 AMMs (optional)
            [
                async (): Promise<void> => {
                    console.log("deploy ammReader...")
                    const ammReaderContract = this.factory.create<AmmReader>(ContractName.AmmReader)
                    await ammReaderContract.deployImmutableContract()
                },
            ],
            // batch 3 (transferring ownership to governance)

            // batch 4 (optional)
            // deploy a new implementation of ClearingHouse, in order to make xdai blockscout verification works,
            // we'll deploy a flatten one in an isolated build env. then PROXY_ADMIN should upgrade proxy to the new implementation

            // batch 5 (optional)
            // deploy a new implementation of Amm, in order to make xdai blockscout verification works,
            // we'll deploy a flatten one in an isolated build env. then PROXY_ADMIN should upgrade proxy to the new implementation

        ],
    }

    constructor(
        readonly layerType: Layer,
        readonly settingsDao: SettingsDao,
        readonly systemMetadataDao: SystemMetadataDao,
    ) {
        this.externalContract = settingsDao.getExternalContracts(layerType)
        this.deployConfig = new DeployConfig(settingsDao.stage)
        this.factory = new ContractWrapperFactory(layerType, systemMetadataDao, this.deployConfig.confirmations)
    }

    get confirmations(): number {
        return this.deployConfig.confirmations
    }

    async publishContracts(batch: number): Promise<void> {
        const taskBatches = this.taskBatchesMap[this.layerType]
        const completeTasksLength = taskBatches.flat().length
        const tasks = taskBatches[batch]
        if (!taskBatches.length || !tasks) {
            return
        }

        const batchStartVer = taskBatches.slice(0, batch).flat().length
        const batchEndVer = batchStartVer + tasks.length
        console.log(`batchStartVer: ${batchStartVer}, batchEndVer: ${batchEndVer}`)

        const ver = this.settingsDao.getVersion(this.layerType)
        if (ver < batchStartVer) {
            throw new Error(
                `starting version (${ver}) is less than the batch's start version (${batchStartVer}), are you sure the previous batches are completed?`,
            )
        }
        console.log(`publishContracts:${ver}->${completeTasksLength}`)

        // clear metadata if it's the first version
        if (ver === 0) {
            console.log("clearing metadata...")
            this.systemMetadataDao.clearMetadata(this.layerType)
        }

        for (const task of tasks.slice(ver - batchStartVer, batchEndVer - batchStartVer)) {
            await task()
            this.settingsDao.increaseVersion(this.layerType)
        }

        // transfer admin if it's the last batch for current layer
        const isLastBatchForCurrentLayer = taskBatches.length - 1 === batch
        if (!isLastBatchForCurrentLayer) {
            return
        }

        console.log(`${this.layerType} contract deployment finished.`)
    }
}
