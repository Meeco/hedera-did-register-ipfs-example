**Generate and Register a Hedera DID Document**

Steps:
1. Generate keys and did document
1. Create a new hedera topic
1. Write did document to IPFS
1. Create a hedera did
1. Register did create document event to HCS

**To run:**

- `yarn` - to install dependencies

- `yarn did` - to generate and register a did and did document. All required values will be printed to console.
- `yarn mktopic` - to create a HCS topic only.


**Required environment variables**

[see .env.example](.env.example)

```
cp .env.example .env
```

- `MY_ACCOUNT_ID` : Account ID from https://portal.hedera.com/
- `MY_PRIVATE_KEY` : ECDSA DER encoded private key from https://portal.hedera.com/
- `WEB3_STORAGE_API_TOKEN` : from https://web3.storage/
