
# Manual verification of Implementation Contracts.

This guide explains how to manually verify Implementation contracts and link them to the Proxy.

### Pre-requisite
- The contracts are deployed and the `.openzeppelin`, `build` & `cache`(importantly solc-input.json) folder is generated as a result.
- The Proxy contract has been verified already using ([Proxy-verification]()).

### Steps to verify

1. Get the Implementation contract address for which manual verification needs to be done from the json file under `.openzeppelin`
2. Goto the [Network Explorer](snowtrace.io) & search for the Implementation contract address & goto the Contracts Tab.
3. Click on `Publish & Verify`.
4. Verify the contract address & select the Solidity settings as follows           

```bash
    Compiler type = Solidity(standard-json-input)
    Compiler version = v0.6.9 & 
    License = MIT License
```
    
6. On the next page upload the `solc-input.json` from the cache folder.
7. Leave the constructor as default, if populated any.
8. Proceed to verify.

On successful verification, there should be a transaction hash for the verification process.

### Linking Contracts

After a successful Implementation Contract verification, the same can be linked by going to the Proxy contract address(from system-staging.json) on the explorer & clicking on 'more options' under Contracts Tab.
And then `Is this a proxy` to check & save it to link Proxy & Implementation contracts together.
After linking, the storage state of the contracts can be read.