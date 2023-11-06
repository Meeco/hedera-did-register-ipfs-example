import {
  PrivateKey,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';
import { Readable } from 'stream';
import { hederaClient } from './hedera-client';
import chalk from 'chalk';

main();

async function main() {
  let txResponse = await new TopicCreateTransaction().execute(hederaClient);

  // Grab the newly generated topic ID
  let receipt = await txResponse.getReceipt(hederaClient);
  let topicId = receipt.topicId;
  console.log(`${chalk.cyan('Your topic ID is')}: ${topicId}`);

  process.exit(0);
}

