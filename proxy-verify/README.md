# Verify Upgradeable Proxy Admin Contracts on any network

Notes:

1. The contracts with respect for the parent project version is taken from 
https://github.com/OpenZeppelin/openzeppelin-upgrades/tree/%40openzeppelin/buidler-upgrades%401.2.0/packages/core/contracts/proxy

2. config to compile & verify used on hardhat.config.json is taken from `builder.config.js` from the above project directory

    ``` Compiler Settings
        solc - 0.6.8
        optimization - none
        License - none
    ```

### Method 1: Hardhat Verification

1. cd proxy-verify
2. npm install
3. copy .env.example to .env & update the variables
3. npx hardhat verify --constructor-args argument.js --network fuji 0x57405E9B5534e5894c9341D9ACa5b70DB4237959
    Note:
    1. use the proxy contract address
    2. argument.js file has 3 params
        - logic address
        - admin address
        - data

### Method 2: Manual Verification using Hardhat Build file

1. cd proxy-verify
2. npm install
3. copy .env.example to .env & update the variables
4. run `npx hardhat --config hardhat.config.js compile`
5. Copy the "input":{} field from artifacts -> build-info -> JSON file and paste it in a new solc-input.json file

6. Go to the contract address(Proxy contract) on the explorer and #contract tab & then verify & publish 

7. Fill in the compiler details & License type as mentioned above

8. Goto the Next page, Upload the solc-input.json file &  correct the constructor arguments from 
this, 

`Note: Unable to determine contructor arguments, please check and replace with correct values (43616e6e6f742073657420612070726f787920696d706c656d656e746174696f6e20746f2061206e6f6e2d636f6e74726163742061646472657373000000000000000000000000c106a4ae196a5fd3e8ca6985e6465f0f2c46c1b2000000000000000000000000631ece59dae54e0dc7b43dc0a7a23d2d6ccf189200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000)`

Change them to remove the leading bytes, so that there is 24 0's prior to the logic address found in .json config file.
Remove the trailing bracket.
Ref: https://twitter.com/rstormsf/status/1118961940192083969?s=20

Change to:
`000000000000000000000000c106a4ae196a5fd3e8ca6985e6465f0f2c46c1b2000000000000000000000000631ece59dae54e0dc7b43dc0a7a23d2d6ccf189200000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000`

9. Proceed to verify


### Method 3: Manual Verification using Remix
1. Download 4 contracts from the github link

2. Replace the contracts imports with  `@openzeppelin/contracts@3.2`
Example:
`import '@openzeppelin/contracts/utils/Address.sol';` with 
`import '@openzeppelin/contracts@3.2/utils/Address.sol';`
 
3. Flatten the contractss using flattener tool in remix

4. Build the flattened contract with the compiler settings as mentioned above.

5. Follow steps 6 to 9 from Method 2(copy paste the flattened contract.sol code instead of solc-input.json in step 8).