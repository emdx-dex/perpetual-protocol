/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers } from "@nomiclabs/buidler"
import { BuidlerRuntimeEnvironment } from "@nomiclabs/buidler/types"
import { ContractPublisher } from "../publish/NewAmmContractPublisher"
import { SettingsDao } from "../publish/SettingsDao"
import { SystemMetadataDao } from "../publish/NewAmmSystemMetadataDao"
import { AccountMetadata, Layer, Network, Stage } from "./common"

export async function deployLayer(
    stage: Stage,
    layerType: Layer,
    batch: number,
    bre: BuidlerRuntimeEnvironment,
): Promise<void> {
    const network = bre.buidlerArguments.network! as Network

    // only expose accounts when deploy on local node, otherwise assign a empty array
    const isLocalhost: boolean = network === "localhost"
    const accounts = isLocalhost ? (bre.config.networks.buidlerevm.accounts as AccountMetadata[]) : []

    const settingsDao = new SettingsDao(stage)
    const systemMetadataDao = new SystemMetadataDao(settingsDao)
    systemMetadataDao.setAccounts(layerType, accounts)

    const signers = await ethers.getSigners()
    const address = await signers[0].getAddress()
    console.log(`deployer=${address}`)
    const publisher = new ContractPublisher(layerType, settingsDao, systemMetadataDao)

    await publisher.publishContracts(batch)
}
