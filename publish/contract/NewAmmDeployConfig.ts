import { BigNumber, utils } from "ethers"
import {
    NEW_PRICE_FEED_KEY,
    NEW_AGGREGATOR_ADDRESS,
    NEW_QUOTE_ASSET_RESERVE,
    NEW_BASE_ASSET_RESERVE,
    NEW_FLUCTUATION_LIMIT_RATIO,
    NEW_MAX_HOLDING_BASE_ASSET,
    NEW_OPEN_INTEREST_NOTIONAL_CAP
} from "../../constants"

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
        quoteAssetReserve: BigNumber.from(NEW_QUOTE_ASSET_RESERVE).mul(DEFAULT_DIGITS),
        baseAssetReserve: BigNumber.from(NEW_BASE_ASSET_RESERVE).mul(DEFAULT_DIGITS), // 20000 NEW TOKEN
        tradeLimitRatio: BigNumber.from(90)
            .mul(DEFAULT_DIGITS)
            .div(100), // 0% trading limit ratio
        fundingPeriod: BigNumber.from(3600), // 1 hour
        fluctuation: utils.parseEther(NEW_FLUCTUATION_LIMIT_RATIO)
            .div(100), // 0%
        priceFeedKey: NEW_PRICE_FEED_KEY,
        tollRatio: BigNumber.from(10)
            .mul(DEFAULT_DIGITS)
            .div(10000), // 0.1%
        spreadRatio: BigNumber.from(0)
            .mul(DEFAULT_DIGITS)
            .div(10000), // 0.0%
    },
    properties: {
        maxHoldingBaseAsset: utils.parseEther(NEW_MAX_HOLDING_BASE_ASSET), // 0 NEW TOKEN ~= $0 USD
        openInterestNotionalCap: utils.parseEther(NEW_OPEN_INTEREST_NOTIONAL_CAP), // $500K
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
