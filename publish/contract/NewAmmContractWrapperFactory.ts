/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Contract } from "ethers"
import { Layer } from "../../scripts/common"
import { AmmInstanceName, ContractName} from "../NewAmmContractName"
import { SystemMetadataDao } from "../NewAmmSystemMetadataDao"
import { NewAmmContractWrapper } from "./NewAmmContractWrapper"

export class ContractWrapperFactory {
    constructor(
        protected readonly layerType: Layer,
        protected readonly systemMetadataDao: SystemMetadataDao,
        protected readonly confirmations: number,
    ) {}

    create<T extends Contract>(contractFileName: ContractName): NewAmmContractWrapper {
        return new NewAmmContractWrapper(
            this.layerType,
            this.systemMetadataDao,
            contractFileName,
            contractFileName,
            this.confirmations,
        )
    }

    createAmm(ammInstanceName: AmmInstanceName): NewAmmContractWrapper {
        return new NewAmmContractWrapper(
            this.layerType,
            this.systemMetadataDao,
            ContractName.Amm,
            ammInstanceName,
            this.confirmations,
        )
    }
}
