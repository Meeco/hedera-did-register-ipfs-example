import { Client, Hbar } from '@hashgraph/sdk';

function environmentSetup() {
  //Grab your Hedera testnet account ID and private key from your .env file
  const myAccountId = process.env.MY_ACCOUNT_ID;
  const myPrivateKey = process.env.MY_PRIVATE_KEY;

  // If we weren't able to grab it, we should throw a new error
  if (!myAccountId || !myPrivateKey) {
    throw new Error(
      'Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present'
    );
  }

  const client = Client.forTestnet();

  //Set your account as the client's operator
  client.setOperator(myAccountId, myPrivateKey);

  //Set the default maximum transaction fee (in Hbar)
  client.setDefaultMaxTransactionFee(new Hbar(1));

  //Set the maximum payment for queries (in Hbar)
  client.setMaxQueryPayment(new Hbar(1));
  return client;
}

export const hederaClient = environmentSetup();
