**Generate and Register a Hedera DID Document**

- Create a new hedera topic
- Generate keys and did document
- Write did document to IPFS
- Create a hedera did
- Register did create document event to HCS

**To run:**

- `yarn` to install dependencies
- `yarn did` to generate and register a did and did document. All required values will be printed to console.

**Required environment variables**

(see .env.example)

- MY_ACCOUNT_ID (Account ID from https://portal.hedera.com/)
- MY_PRIVATE_KEY (ECDSA DER encoded private key from https://portal.hedera.com/)
- WEB3_API_TOKEN (from https://web3.storage/)
