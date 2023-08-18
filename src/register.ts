import {
  PrivateKey,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';
import { generateBls12381G2KeyPair } from '@mattrglobal/bbs-signatures';
import base58 from 'bs58';
import chalk from 'chalk';
import { base58btc } from 'multiformats/bases/base58';
import { Readable } from 'stream';
import nacl from 'tweetnacl';
import { Web3Storage } from 'web3.storage';
import { hederaClient } from './hedera-client';

if (!process.env.WEB3_API_TOKEN) {
  console.error(
    `WEB3_API_TOKEN environment variable required to push to web3.storage`
  );
  process.exit(1);
}

main();

async function main() {
  const topicId = await makeTopic();

  if (!topicId) return;

  const { doc: didDoc, secretKey } = await makeHederaDidDoc(
    topicId!.toString()
  );

  const { cid } = await writeDidDocumentToIPFS(didDoc);

  const didPrivateKey = Buffer.from(secretKey);

  await writeHcsDidCreateMessage({
    cid,
    didDoc,
    didPrivateKey,
    topicId,
  });

  process.exit(0);
}

/**
 * Create a new HCS topic
 */
async function makeTopic() {
  let txResponse = await new TopicCreateTransaction().execute(hederaClient);

  // Grab the newly generated topic ID
  let receipt = await txResponse.getReceipt(hederaClient);
  let topicId = receipt.topicId;
  console.log(`${chalk.cyan('Your topic ID is')}: ${topicId}`);
  return topicId;
}

/**
 * Construct a new Hedera DID document based on the Version 0.9 spec
 * https://github.com/Meeco/hedera-did-spec/blob/main/did-method-specification.md
 */
async function makeHederaDidDoc(topicId: string) {
  // Create a new key pair to use for verification method
  const { publicKey, secretKey } = nacl.sign.keyPair();

  // Log so we can get a copy
  console.log(`
${chalk.blue('Ed25519 Verification secret key (hex)')}: ${Buffer.from(
    secretKey
  ).toString('hex')}
${chalk.blue('Ed25519 Verification public key (hex)')}: ${Buffer.from(
    publicKey
  ).toString('hex')}
  `);

  // Create our BLS12381G2 Keypair to use for BBS Signatures
  const blsKeyPair = await generateBls12381G2KeyPair();

  // Log so we can get a copy
  console.log(`
${chalk.green('Bls12381G2 Verification secret key (hex)')}: ${Buffer.from(
    blsKeyPair.secretKey
  ).toString('hex')}
${chalk.green('Bls12381G2 Verification public key (hex)')}: ${Buffer.from(
    blsKeyPair.publicKey
  ).toString('hex')}
`);

  const publicKeyMultibase = base58btc.encode(publicKey);
  // const blsPublicKeyMultibase = base58btc.encode(blsKeyPair.publicKey);

  // Prepare all components we need for the did as per the spec
  const hedera_base58_key = base58btc.baseEncode(publicKey);
  const hedera_network = 'testnet';
  const hedera_specific_id_string = `${hedera_network}:${hedera_base58_key}`;
  const hedera_specific_parameters = topicId;

  const did = `did:hedera:${hedera_specific_id_string}_${hedera_specific_parameters}`;

  // If we want to use base58 instead of multibase - 2018 keys do not support
  // multibase but 2020 ones do.
  //  const publicKeyBase58 = base58.encode(vpk);
  const blsPublicKeyBase58 = base58.encode(blsKeyPair.publicKey);

  const doc = {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
    authentication: [`${did}#did-root-key`],
    publicKey: [
      {
        id: `${did}#did-root-key`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase,
        // publicKeyBase58,
      },
      {
        id: `${did}#did-root-key-bbs`,
        type: 'Bls12381G2Key2020',
        controller: did,
        // publicKeyMultibase: blsPublicKeyMultibase,
        // base58 required for mattr library
        publicKeyBase58: blsPublicKeyBase58,
      },
    ],
    // Required for jsonld-signatures - can be full id or just the fragment
    assertionMethod: ['#did-root-key', '#did-root-key-bbs'],
  };

  return { doc, publicKey, secretKey };
}

async function writeDidDocumentToIPFS(didDoc: any) {
  const client = new Web3Storage({ token: process.env.WEB3_API_TOKEN! });
  const name = 'did-document.json';
  const rootCid = await client.put([
    {
      name,
      stream() {
        return Readable.from(
          Buffer.from(JSON.stringify(didDoc), 'utf-8')
        ) as any as ReadableStream;
      },
    },
  ]);
  const cid = `${rootCid}/${name}`;

  // console.log(`Root CID is ${rootCid}`);
  // console.log(`https://ipfs.io/ipfs/${cid}`);
  console.log(`
${chalk.yellow('DID Document file CID')}: ${cid}
`);
  return { rootCid, name, cid };
}

async function writeHcsDidCreateMessage({
  cid,
  didDoc,
  didPrivateKey,
  topicId,
}: {
  cid: string;
  didDoc: any;
  didPrivateKey: Buffer;
  topicId: TopicId;
}) {
  const did = didDoc.id;
  const url = `https://ipfs.io/ipfs/${cid}`;

  const messageData = {
    operation: 'create',
    did,
    event: Buffer.from(
      JSON.stringify({
        DIDDocument: {
          id: did,
          type: 'DIDDocument',
          cid: cid,
          url,
        },
      })
    ).toString('base64'),
  };

  const privateKey = PrivateKey.fromBytes(didPrivateKey);
  const signatureData = privateKey.sign(
    Buffer.from(JSON.stringify(messageData), 'utf-8')
  );
  const signature = Buffer.from(signatureData).toString('base64');

  const envelope = {
    signature,
    message: messageData,
  };

  // console.log(envelope);
  // console.log(signature);

  let sendResponse = await new TopicMessageSubmitTransaction({
    topicId,
    message: Buffer.from(JSON.stringify(envelope), 'utf-8'),
  }).execute(hederaClient);

  // Get the receipt of the transaction
  const getReceipt = await sendResponse.getReceipt(hederaClient);

  // Get the status of the transaction
  // const transactionStatus = getReceipt.status;
  // console.log(`Transaction status: ${transactionStatus}`)

  console.log(`
${chalk.red('Your DID')}: ${didDoc.id}
`);
  console.log(`
Your did document has been registered.
Please allow some time for consensus before trying to resolve
`);
}
