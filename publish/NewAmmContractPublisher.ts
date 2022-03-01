/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers } from "@nomiclabs/buidler"
import { ExternalContracts, Layer } from "../scripts/common"
import {
    ClearingHouse,
    InsuranceFund,
    L2PriceFeed,
    ChainlinkL1
} from "../types/ethers"
import { ContractWrapperFactory } from "./contract/NewAmmContractWrapperFactory"
import { DeployConfig } from "./contract/NewAmmDeployConfig"
import { ContractName } from "./ContractName"
import { SettingsDao } from "./SettingsDao"
import { SystemMetadataDao } from "./NewAmmSystemMetadataDao"
import { NEW_PRICE_FEED_KEY, NEW_INSTANCE_NAME } from "../constants"

export type DeployTask = () => Promise<void>

/* eslint-disable no-console */
export class ContractPublisher {
    readonly externalContract: ExternalContracts
    readonly factory: ContractWrapperFactory
    readonly deployConfig: DeployConfig
    protected taskBatchesMap: Record<Layer, DeployTask[][]> = {
        layer1: [
        ],
        layer2: [
            [
                async (): Promise<void> => {
                    console.log(`deploy ${NEW_INSTANCE_NAME} amm...`)
                    const l2PriceFeedContract = this.factory.create<L2PriceFeed>(ContractName.L2PriceFeed)
                    const ammContract = this.factory.createAmm(NEW_INSTANCE_NAME)
                    const quoteTokenAddr = this.externalContract.usdc!
                    await ammContract.deployUpgradableContract(
                        this.deployConfig.ammConfigMap,
                        l2PriceFeedContract.address!,
                        quoteTokenAddr,
                        false
                    )
                },
                async (): Promise<void> => {
                    console.log(`add ${NEW_INSTANCE_NAME} aggregator to L2PriceFeed`)
                    const l2PriceFeed = await this.factory.create<L2PriceFeed>(ContractName.L2PriceFeed).instance()
                    await (
                        await l2PriceFeed.addAggregator(ethers.utils.formatBytes32String(NEW_PRICE_FEED_KEY.toString()))
                    ).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    console.log(`add ${NEW_INSTANCE_NAME} aggregator of chainlink price feed...`)
                    const chainlinkContract = this.factory.create<ChainlinkL1>(ContractName.ChainlinkL1)
                    const chainlink = await chainlinkContract.instance()
                    const address = this.deployConfig.chainlinkMap[NEW_PRICE_FEED_KEY]
                    await (
                        await chainlink.addAggregator(
                            ethers.utils.formatBytes32String(NEW_PRICE_FEED_KEY.toString()),
                            address,
                        )
                    ).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    console.log(`set ${NEW_INSTANCE_NAME} amm Cap...`)
                    const amm = await this.factory.createAmm(NEW_INSTANCE_NAME).instance()
                    const { maxHoldingBaseAsset, openInterestNotionalCap } = this.deployConfig.ammConfigMap[
                        "NEW"
                    ].properties
                    if (maxHoldingBaseAsset.gt(0)) {
                        await (
                            await amm.setCap(
                                { d: maxHoldingBaseAsset.toString() },
                                { d: openInterestNotionalCap.toString() },
                            )
                        ).wait(this.confirmations)
                    }
                },
                async (): Promise<void> => {
                    console.log(`${NEW_INSTANCE_NAME} amm.setCounterParty...`)
                    const clearingHouseContract = this.factory.create<ClearingHouse>(ContractName.ClearingHouse)
                    const amm = await this.factory.createAmm(NEW_INSTANCE_NAME).instance()
                    await (await amm.setCounterParty(clearingHouseContract.address!)).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    console.log(`insuranceFund.add ${NEW_INSTANCE_NAME} amm...`)
                    const insuranceFundContract = this.factory.create<InsuranceFund>(ContractName.InsuranceFund)
                    const ammContract = this.factory.createAmm(NEW_INSTANCE_NAME)
                    const insuranceFund = await insuranceFundContract.instance()
                    await (await insuranceFund.addAmm(ammContract.address!)).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    console.log(`opening Amm ${NEW_INSTANCE_NAME}...`)
                    const ethUsdc = await this.factory.createAmm(NEW_INSTANCE_NAME).instance()
                    await (await ethUsdc.setOpen(true)).wait(this.confirmations)
                },
                async (): Promise<void> => {
                    const gov = this.externalContract.foundationGovernance!
                    console.log(
                        `transferring ${NEW_INSTANCE_NAME} owner to governance=${gov}...please remember to claim the ownership`,
                    )
                    const PAIR = await this.factory.createAmm(NEW_INSTANCE_NAME).instance()
                    await (await PAIR.setOwner(gov)).wait(this.confirmations)
                },
            ]

        ],
    }

    constructor(
        readonly layerType: Layer,
        readonly settingsDao: SettingsDao,
        readonly systemMetadataDao: SystemMetadataDao,
    ) {
        this.externalContract = settingsDao.getExternalContracts(layerType)
        this.deployConfig = new DeployConfig()
        this.deployConfig = new DeployConfig()
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
