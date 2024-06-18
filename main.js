//Modify these fields before running your code

//Select your network "Testnet" or "Mainnet"
const net = "Testnet";
//Secret of your wallet (Don't share it!) Testnet address generator: https://xrpl.org/resources/dev-tools/xrp-faucets/ Fake example: "sn5XTrWNGNysp4o1JYEFp7wSbN6Gz"
const seed = "sEdSLesJDQnc6eMRQAm7obJRwBwrAD7";
// Short name of your token
const IOU_Token = "TRY";
//Secret of your second wallet, it's going to receive your IOU tokens (Don't share it!) Testnet address generator: https://xrpl.org/resources/dev-tools/xrp-faucets/ Fake example: "sn5XTrWNGNysp4o1JYEFp7wSbN6Gz"
const seed2 = "sEd7pYimVxdMD7RT4KNSWdRWdcC1TVU";
//End modify variables

//Don't touch anything after this line

const xrpl = require("xrpl");
const { derive, utils, signAndSubmit } = require("xrpl-accountlib");

async function main() {
  function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let network = "wss://s.altnet.rippletest.net:51233/	";
  if (net === "Mainnet") {
    network = "wss://s2.ripple.com/	";
  }
  const account = derive.familySeed(seed, { algorithm: "secp256k1" });
  console.log(
    `Your wallet1 public address is: ${account.address}`
  );
  const client = new xrpl.Client(network);
  await client.connect();
  const my_wallet = xrpl.Wallet.fromSeed(seed);
  const networkInfo = await utils.txNetworkAndAccountValues(network, account);
  console.log(`Your public address is: ${my_wallet.address}`);
  const response = await client.request({
    command: "account_info",
    account: my_wallet.address,
    ledger_index: "validated",
  });
  const total_balance = response.result.account_data.Balance / 1000000;
  console.log(
    `Your total balance (available+reserves) is: ${total_balance} XRP`
  );

  const account_info = await client.request({
    command: "account_info",
    account: my_wallet.address,
  });

  let current_sequence = account_info.result.account_data.Sequence;
  console.log("Actual Sequence", current_sequence);
  //Activate rippling:
  const prepared = {
    TransactionType: "AccountSet",
    Account: my_wallet.address,
    SetFlag: 8,
    Sequence: current_sequence,
    ...networkInfo.txValues,
  };

  // Submit AccountSet -------------------------------------------------------
  const tx = signAndSubmit(prepared, network, account);
  console.log("Info tx ", tx);
  const jsonDataString = JSON.stringify(tx);
  console.log(jsonDataString);
  //finished

  const account2 = derive.familySeed(seed2, { algorithm: "secp256k1" });
  console.log(
    `Your public address2 from xrpl.accountlib is: ${account2.address}`
  );

  const my_wallet2 = xrpl.Wallet.fromSeed(seed2);
  const networkInfo2 = await utils.txNetworkAndAccountValues(network, account2);
  console.log(`Your public address is: ${my_wallet2.address}`);
  const networkInf2 = await utils.txNetworkAndAccountValues(network, account2);
  const response2 = await client.request({
    command: "account_info",
    account: my_wallet2.address,
    ledger_index: "validated",
  });
  const total_balance2 = response2.result.account_data.Balance / 1000000;
  
  console.log(
    `Your total balance2 (available+reserves) is: ${total_balance2} XRP`
  );
  
  let current_sequence2 = response2.result.account_data.Sequence;
  console.log("Actual Sequence 2", current_sequence2);
  //Activate rippling:
  const prepared2 = {
    TransactionType: "TrustSet",
    Account: my_wallet2.address,
    LimitAmount: {
      currency: IOU_Token,
      issuer: my_wallet.address,
      value: "1000000",
    },
    ...networkInfo2.txValues,
  };

  // Submit Trustline for the second wallet -------------------------------------------------------
  const tx2 = await signAndSubmit(prepared2, network, account2);
  console.log("Info tx2 ", tx2);
  const jsonDataString2 = JSON.stringify(tx2);
  console.log(jsonDataString2);
  //finished

  //Mint tokens from first wallet and send them to the second one
  const networkInfo3 = await utils.txNetworkAndAccountValues(network, account);

  const prepared3 = {
    TransactionType: "Payment",
    Account: my_wallet.address,
    Destination: my_wallet2.address,
    Amount: {
      currency: IOU_Token,
      issuer: my_wallet.address,
      value: "1000000",
    },
    ...networkInfo3.txValues,
  };

  const tx3 = await signAndSubmit(prepared3, network, account);
  console.log("Info tx3 ", tx3);
  const jsonDataString3 = JSON.stringify(tx3);
  console.log(jsonDataString3);
}
main();
