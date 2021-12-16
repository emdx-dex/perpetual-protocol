const {
    LOCALHOST_URL,
    GAS_PRICE,
    GAS,
    ROPSTEN_URL,
    ROPSTEN_PK,
    KOVAN_URL,
    KOVAN_PK,
    RINKEBY_URL,
    RINKEBY_PK,
    HOMESTEAD_PK,
    HOMESTEAD_URL,
    SOKOL_PK,
    SOKOL_URL,
    XDAI_PK,
    XDAI_URL,
} = require("./constants")
const HDWalletProvider = require("@truffle/hdwallet-provider")

/*eslint-disable */
module.exports = {
    networks: {
        localhost: {
            url: LOCALHOST_URL,
            gas: GAS,
            gasPrice: GAS_PRICE,
            networkId: "*",
        },
        ropsten: {
            provider: () => new HDWalletProvider(ROPSTEN_PK, ROPSTEN_URL),
            gas: GAS,
            gasPrice: GAS_PRICE,
            networkId: 3,
        },
        kovan: {
            provider: () => new HDWalletProvider(KOVAN_PK, KOVAN_URL),
            gas: GAS,
            gasPrice: GAS_PRICE,
            networkId: 42,
        },
        rinkeby: {
            provider: () => new HDWalletProvider(RINKEBY_PK, RINKEBY_URL),
            gas: GAS,
            gasPrice: GAS_PRICE,
            networkId: 4,
        },
        homestead: {
            provider: () => new HDWalletProvider(HOMESTEAD_PK, HOMESTEAD_URL),
            gas: GAS,
            gasPrice: GAS_PRICE,
            networkId: 1,
        },
        sokol: {
            provider: () => {
                return new HDWalletProvider(SOKOL_PK, SOKOL_URL)
            },
            network_id: 77,
        },
        xdai: {
            provider: () => {
                return new HDWalletProvider(XDAI_PK, XDAI_URL)
            },
            network_id: 100,
        },
    },
}
