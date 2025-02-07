/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion */
import { ShellString } from "shelljs"
import { ExternalContracts, Layer, Network, Stage, SystemDeploySettings } from "../scripts/common"
import production from "./settings/production.json"
import productionNewAmm from "./settings/production-new-amm.json"
import staging from "./settings/staging.json"
import devNewAmm from "./settings/dev-new-amm.json"
import stagingNewAmm from "./settings/staging-new-amm.json"
import dev from "./settings/dev.json"

export class SettingsDao {
    readonly settingsCached!: SystemDeploySettings
    constructor(readonly stage: Stage) {
        switch (stage) {
            case "production":
                this.settingsCached = production as SystemDeploySettings
                break
            case "production-new-amm":
                this.settingsCached = productionNewAmm as SystemDeploySettings
                break
            case "staging":
                this.settingsCached = staging as SystemDeploySettings
                break
            case "staging-new-amm":
                this.settingsCached = stagingNewAmm as SystemDeploySettings
                break
            case "dev-new-amm":
                this.settingsCached = devNewAmm as SystemDeploySettings
                break
            case "dev":
                this.settingsCached = dev as SystemDeploySettings
                break
            case "test":
                try {
                    this.settingsCached = require("./settings/test.json")
                } catch (e) {
                    this.settingsCached = {
                        layers: {
                            layer1: {
                                chainId: 31337,
                                network: "localhost",
                                version: "0",
                                externalContracts: {
                                    foundationGovernance: "0xa230A4f6F38D904C2eA1eE95d8b2b8b7350e3d79",
                                    ambBridgeOnEth: "0xD4075FB57fCf038bFc702c915Ef9592534bED5c1",
                                    multiTokenMediatorOnEth: "0x30F693708fc604A57F1958E3CFa059F902e6d4CB",
                                    usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                                },
                            },
                            layer2: {
                                chainId: 31337,
                                network: "localhost",
                                version: "0",
                                externalContracts: {
                                    foundationGovernance: "0x44883405Eb9826448d3E8eCC25889C5941E79d9b",
                                    ambBridgeOnXDai: "0xc38D4991c951fE8BCE1a12bEef2046eF36b0FA4A",
                                    multiTokenMediatorOnXDai: "0xA34c65d76b997a824a5E384471bBa73b0013F5DA",
                                    usdc: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
                                    arbitrageur: "0x68dfc526037E9030c8F813D014919CC89E7d4d74",
                                },
                            },
                        },
                    }
                }
                break
            default:
                throw new Error(`Stage not found=${stage}`)
        }
    }

    // TODO easy to break when rename file or directory
    private get settingsFilePath(): string {
        return `./publish/settings/${this.stage}.json`
    }

    setVersion(layerType: Layer, n: number): void {
        this.settingsCached.layers[layerType]!.version = n.toString()
        ShellString(JSON.stringify(this.settingsCached, null, 2)).to(this.settingsFilePath)
    }

    getStage(): Stage {
        return this.stage
    }

    getSystemDeploySettings(): SystemDeploySettings {
        return this.settingsCached
    }

    getVersion(layerType: Layer): number {
        return Number(this.settingsCached.layers[layerType]!.version)
    }

    increaseVersion(layerType: Layer): void {
        const layer = this.settingsCached.layers[layerType]!
        const increased = Number(layer.version) + 1
        layer.version = increased.toString()
        ShellString(JSON.stringify(this.settingsCached, null, 2)).to(this.settingsFilePath)
        console.log(`increase ${this.stage}:${layerType} version to ${layer.version}`)
    }

    getExternalContracts(layerType: Layer): ExternalContracts {
        return this.settingsCached.layers[layerType]!.externalContracts
    }

    getChainId(layerType: Layer): number {
        return this.settingsCached.layers[layerType]!.chainId
    }

    getNetwork(layerType: Layer): Network {
        return this.settingsCached.layers[layerType]!.network
    }

    isLocal(): boolean {
        return this.stage === "test"
    }

    getMetadataFileName(): string {
        switch(this.stage) {
            case "test":
                return "system-local.json";
            case "dev":
            case "dev-new-amm":
                return "system-dev.json";
            case "staging":
            case "staging-new-amm":
                return "system-staging.json"
            case "production":
            case "production-new-amm":
                return "system.json"
            default:
                throw new Error(`stage=${this.stage} not supported`)
        }
    }
}
