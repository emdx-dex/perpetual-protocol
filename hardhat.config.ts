/* eslint-disable import/first */
require("dotenv").config();
const fs = require('fs');
import "@nomiclabs/hardhat-etherscan";
import { task } from "hardhat/config";


enum ContractNames {
  InsuranceFund = "InsuranceFund",
  Ark = "Ark",
  L2PriceFeed = "L2PriceFeed",
  ChainlinkL1 = "ChainlinkL1",
  //Issue with verifying the below contracts due to bytecode mismatch, Please verify manually until solc version upgrade
  //ClearingHouse = "ClearingHouse",
  //ClearingHouseViewer = "ClearingHouseViewer",
  //Amm = "Amm"
}

function isValidContract(contractName: string): boolean {
  const options: string[] = Object.values(ContractNames);
  return options.includes(contractName);
}

task("verify-contracts", "Verify contracts on the explorer with etherscan plugin")
  .addPositionalParam("stage", "Target stage of the deployment")
  .setAction(async ({ stage }, hre) => {
    var data = JSON.parse(fs.readFileSync('system-' + stage + '.json'))
    var proxyAddresses: string[] = []
    if (data.layers && data.layers.layer2 && data.layers.layer2.contracts) {
      Object.values(data.layers.layer2.contracts).map((contracts: any) => {
        if (isValidContract(contracts['name'] as string)){
          proxyAddresses.push(contracts['address'] as string)
        }
      })
      if (proxyAddresses.length > 0) {
        const { verifyContracts } = require("./scripts/verify-contracts")
        await verifyContracts(proxyAddresses, hre)
      }
    } else {
      console.error("Json doesnt have contract addresses to parse")
      process.exit(1)
    }
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    compilers: [
      {
        version: "0.6.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "istanbul",
        },
      }
    ]
  },
  networks: {
    fuji: {
      url: process.env.FUJI_URL,
      gasPrice: Number(process.env.GAS_PRICE),
      accounts: [process.env.FUJI_PK],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./src",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
