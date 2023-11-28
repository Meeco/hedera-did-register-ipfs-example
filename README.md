# Generate and Register a Hedera DID Document

Steps:
1. Generate keys and did document
1. Create a new hedera topic
1. Write did document to IPFS
1. Create a hedera did
1. Register did create document event to HCS

## Required environment variables

_**This repo operates on the **testnet**_

```
cp .env.example .env
```

- `MY_ACCOUNT_ID` : Account ID from https://portal.hedera.com/
- `MY_PRIVATE_KEY` : ECDSA DER encoded private key from https://portal.hedera.com/
- `WEB3_STORAGE_API_TOKEN` : from https://web3.storage/

[see .env.example](.env.example)

## To run:

- `yarn` - to install dependencies

- `yarn did` - to generate and register a `hedera:did`` and did document on IPFS. All required values will be printed to console.
- `yarn mktopic` - to create a HCS topic only.
