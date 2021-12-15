import { BigNumber } from "ethers"
import { NEW_PRICE_FEED_KEY, NEW_AGGREGATOR_ADDRESS, NEW_INSTANCE_NAME } from "../../constants"

// TODO replace by ethers format
const DEFAULT_DIGITS = BigNumber.from(10).pow(18)

// amm
interface AmmDeployArgs {
    quoteAssetReserve: BigNumber
    baseAssetReserve: BigNumber
    tradeLimitRatio: BigNumber
    fundingPeriod: BigNumber
    fluctuation: BigNumber
    priceFeedKey: string
    tollRatio: BigNumber
    spreadRatio: BigNumber
}

interface AmmProperties {
    maxHoldingBaseAsset: BigNumber
    openInterestNotionalCap: BigNumber
}

export type AmmConfig = { deployArgs: AmmDeployArgs; properties: AmmProperties }
export type AmmConfigMap = Record<string, AmmConfig>

export const NEW_USD_AMM: AmmConfig = {
    deployArgs: {
        // base * price
        quoteAssetReserve: BigNumber.from(100000).mul(DEFAULT_DIGITS),
        baseAssetReserve: BigNumber.from(20000).mul(DEFAULT_DIGITS), // 20000 NEW TOKEN
        tradeLimitRatio: BigNumber.from(90)
            .mul(DEFAULT_DIGITS)
            .div(100), // 90% trading limit ratio
        fundingPeriod: BigNumber.from(3600), // 1 hour
        fluctuation: BigNumber.from(12)
            .mul(DEFAULT_DIGITS)
            .div(1000), // 1.2%
        priceFeedKey: NEW_PRICE_FEED_KEY,
        tollRatio: BigNumber.from(0)
            .mul(DEFAULT_DIGITS)
            .div(10000), // 0.0%
        spreadRatio: BigNumber.from(10)
            .mul(DEFAULT_DIGITS)
            .div(10000), // 0.1%
    },
    properties: {
        maxHoldingBaseAsset: DEFAULT_DIGITS.mul(10), // 10 NEW TOKEN ~= $5000 USD
        openInterestNotionalCap: BigNumber.from(DEFAULT_DIGITS).mul(500000), // $500K
    },
}

export class DeployConfig {
    // deploy
    readonly confirmations: number

    // chainlink
    readonly chainlinkMap: Record<string, string>

    // clearing house
    readonly initMarginRequirement = BigNumber.from(1)
        .mul(DEFAULT_DIGITS)
        .div(10) // 10% - 10x
    readonly maintenanceMarginRequirement = BigNumber.from(625)
        .mul(DEFAULT_DIGITS)
        .div(10000) // 6.25% - 16x
    readonly liquidationFeeRatio = BigNumber.from(125)
        .mul(DEFAULT_DIGITS)
        .div(10000) // 1.25%

    // amm
    readonly ammConfigMap: Record<string, AmmConfig> = {
        NEW: NEW_USD_AMM,
    }

    constructor() {
        this.confirmations = 1
        this.chainlinkMap = {
            [NEW_PRICE_FEED_KEY]: NEW_AGGREGATOR_ADDRESS,
        }
    }
}
