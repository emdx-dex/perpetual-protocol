/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { Stage } from "./common"
import { SettingsDao } from "../publish/SettingsDao"
import { asyncExec } from "./helper"

export async function verifyContracts(
    proxyAddress: string[],
    hre: HardhatRuntimeEnvironment,
): Promise<void> {

    // Verify implementation on etherscan
    for (let i = 0; i < proxyAddress.length; i++) {
        console.log("Proxy Address: " + proxyAddress[i])
        var currentImplAddress:any
        try{
            currentImplAddress = await getImplementationAddress(hre.network.provider, proxyAddress[i]);
        } catch(e){
            currentImplAddress = proxyAddress[i]
        }
        if (currentImplAddress) {
            console.log("Attempting to verify implementation contract: " + currentImplAddress);
            try {
                await hre.run("verify:verify", {
                    address: currentImplAddress,
                    constructorArguments: [],
                });
            } catch (e) {
                console.error(`Failed to verify contract, Please verify Manually: ${e}`);
            }
        }
        console.log("--------------------------------------------------------------------------------------------------")
    }
}


async function main(): Promise<void> {
    const stage = process.argv[2] as Stage
    const settings = new SettingsDao(stage)
    const layer2Network = settings.getNetwork("layer2")
    await asyncExec(`hardhat --network ${layer2Network} verify-contracts ${stage}`)
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error)
            process.exit(1)
        })
}
