const fetch = require('node-fetch');
const { XrplClient } = require('xrpl-client');
const AccountLib = require('xrpl-accountlib');

let testNetCredits;

// generate family seed
const generateMnemonic = () => {
    const generatedAccount = AccountLib.generate.mnemonic();

    return generatedAccount.secret.mnemonic.split(' ');
};

// generate family seed
const generateFamilySeed = () => {
    const generatedAccount = AccountLib.generate.familySeed();

    return generatedAccount.secret.familySeed;
};

// generate secret numbers
const generateSecretNumbers = () => {
    const generatedAccount = AccountLib.generate.secretNumbers();

    const numbers = [...Array(8)].map(() => Array(6));
    for (let r = 0; r < 8; r++) {
        const row = generatedAccount.secret.secretNumbers[r].split('');
        for (let c = 0; c < 6; c++) {
            numbers[r][c] = row[c];
        }
    }
    return numbers;
};

// get funded testnet account
const generateTestnetAccount = async () => {
    if (testNetCredits) {
        return testNetCredits;
    }

    const resp = await fetch('https://xahau-test.net/newcreds', { method: 'POST' });
    const json = await resp.json();

    if (json.secret && json.address) {
        testNetCredits = {
            address: json.address,
            secret: json.secret,
        };
    }

    return testNetCredits;
};

const activateAccount = async (address) => {
    const fundedAccount = await generateTestnetAccount();

    // wait 10 sec
    const start = new Date().getTime();
    while (new Date().getTime() < start + 10000);

    const Transaction = {
        TransactionType: 'Payment',
        Account: fundedAccount.address,
        Destination: address,
        Amount: '100000000',
        Fee: '1000',
        NetworkID: 21338,
    };

    const Connection = new XrplClient('wss://xahau-test.net');

    await Connection.ready();

    const accountInfo = await Connection.send({
        command: 'account_info',
        account: fundedAccount.address,
    });

    Object.assign(Transaction, { Sequence: accountInfo.account_data.Sequence });

    const signedObject = AccountLib.sign(Transaction, AccountLib.derive.familySeed(fundedAccount.secret));

    await Connection.send({
        command: 'submit',
        tx_blob: signedObject.signedTransaction,
    })
        .then(() => {
            Connection.close();
        })
        .catch((SendError) => {
            Connection.close();
            console.error(SendError);
        });
};

module.exports = {
    activateAccount,
    generateTestnetAccount,
    generateSecretNumbers,
    generateFamilySeed,
    generateMnemonic,
};
