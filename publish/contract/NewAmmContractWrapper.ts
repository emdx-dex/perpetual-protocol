/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers } from "@nomiclabs/buidler"
import { Amm } from "../../types/ethers"
import { NewAmmContractWrapperBase } from "./NewAmmContractWrapperBase"
import { AmmConfigMap } from "./NewAmmDeployConfig"
import { BigNumber, utils } from "ethers"
import { CoinGeckoService } from "../CoinGeckoService"
import { NEW_INSTANCE_PRICE } from "../../constants"


export class NewAmmContractWrapper extends NewAmmContractWrapperBase<Amm> {
    private coinGecko = new CoinGeckoService()

    async deployUpgradableContract(
        ammConfigMap: AmmConfigMap,
        priceFeedAddress: string,
        quoteAssetAddress: string,
        fetchPrice= true
    ): Promise<Amm> {
        const ammConfig = ammConfigMap["NEW"]
        const {
            quoteAssetReserve,
            baseAssetReserve,
            tradeLimitRatio,
            fundingPeriod,
            fluctuation,
            priceFeedKey,
            tollRatio,
            spreadRatio,
        } = ammConfig.deployArgs

        let updatedQuoteAssetReserve: BigNumber = quoteAssetReserve
        let price
        if (fetchPrice) {
            price = await this.coinGecko.fetchUsdPrice(priceFeedKey)
        } else {
            price = NEW_INSTANCE_PRICE
        }

        const priceInWei = utils.parseEther(price)
        updatedQuoteAssetReserve = baseAssetReserve.mul(priceInWei).div(BigNumber.from(10).pow(18))

        const priceFeedKeyBytes = ethers.utils.formatBytes32String(priceFeedKey.toString())
        const args = [
            updatedQuoteAssetReserve.toString(),
            baseAssetReserve.toString(),
            tradeLimitRatio.toString(),
            fundingPeriod.toString(),
            priceFeedAddress,
            priceFeedKeyBytes.toString(),
            quoteAssetAddress.toString(),
            fluctuation.toString(),
            tollRatio.toString(),
            spreadRatio.toString(),
        ]
        return super.deployUpgradableContract(...args)
    }
}
