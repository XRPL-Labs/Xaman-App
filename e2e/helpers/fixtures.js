const fs = require('fs');
const fetch = require('node-fetch');
const { XrplClient } = require('xrpl-client');
const AccountLib = require('xrpl-accountlib');

const CRED_FILE = process.env.E2E_CRED_FILE || '/tmp/xaman-e2e-testnet-creds.json';
// 100 XAH payment + fee + 1 XAH account reserve
const ACTIVATION_DROPS = 100000000;
const ACTIVATION_FEE_DROPS = 1000;
const ACTIVATION_RESERVE_DROPS = 10000000;
const MIN_FUND_BALANCE = ACTIVATION_DROPS + ACTIVATION_FEE_DROPS + ACTIVATION_RESERVE_DROPS;
let testNetCredits;

// generate family seed
const generateMnemonic = (strength = 256, algorithm) => {
    const options = { strength };
    if (algorithm) {
        options.algorithm = algorithm;
    }
    const generatedAccount = AccountLib.generate.mnemonic(options);

    return generatedAccount.secret.mnemonic.split(' ');
};

const SAMPLE_24_WORD_MNEMONIC =
    'lamp elevator orchard music glare night upper race mixture bullet property nasty agent sword blind dynamic gossip life series shrug day ice control reunion';

// secp-encoded family seed whose ed25519 r-address is activated on Xahau Testnet
const SAMPLE_FAMILY_SEED_ED_XAHAU = 'shk74ZM1V25arF1EnKvRnXNUCtSay';
const SAMPLE_FAMILY_SEED_ED_ADDRESS = 'rN1SEYxWyG7En8acdjcxQBjWio9ZSs6u99';
const SAMPLE_FAMILY_SEED_SECP_ADDRESS = 'rE1b4ih4MtLuAcr4sPD4oTS2riyammzAkt';

const deriveMnemonicAddress = (words, algorithm) => {
    const mnemonic = Array.isArray(words) ? words.join(' ') : words;
    const options = algorithm && algorithm !== 'secp256k1' ? { algorithm } : undefined;
    return AccountLib.derive.mnemonic(mnemonic, options).address;
};

const deriveFamilySeedAddress = (seed, algorithm) => {
    const options = algorithm && algorithm !== 'secp256k1' ? { algorithm } : undefined;
    return AccountLib.derive.familySeed(seed, options).address;
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

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const persistCredits = (credits) => {
    testNetCredits = credits;
    try {
        fs.writeFileSync(CRED_FILE, JSON.stringify(credits));
    } catch (e) {
        // resume without file still works in-process
    }
};

const forgetCredits = () => {
    testNetCredits = undefined;
    try {
        fs.unlinkSync(CRED_FILE);
    } catch (e) {
        // already gone
    }
};

// the faucet rate-limits per IP, retry with backoff
const allocateFaucetAccount = async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
        const resp = await fetch('https://xahau-test.net/newcreds', { method: 'POST' });
        const json = await resp.json();

        if (json.secret && json.address) {
            // give the faucet funding transaction time to validate
            await sleep(10000);
            return {
                address: json.address,
                secret: json.secret,
            };
        }

        await sleep(15000);
    }

    throw new Error('unable to get funded account from the testnet faucet');
};

const fetchNewFaucetAccount = async () => {
    forgetCredits();
    persistCredits(await allocateFaucetAccount());
    return testNetCredits;
};

// Import/upgrade needs its own funded account. Reusing CRED_FILE re-imports the
// activation faucet, which often already has EUR from a prior 04 Add a asset.
const generateFreshTestnetAccount = () => allocateFaucetAccount();

// get funded testnet account
const generateTestnetAccount = async () => {
    if (testNetCredits) {
        return testNetCredits;
    }

    try {
        const saved = JSON.parse(fs.readFileSync(CRED_FILE, 'utf8'));
        if (saved && saved.address && saved.secret) {
            testNetCredits = { address: saved.address, secret: saved.secret };
            return testNetCredits;
        }
    } catch (e) {
        // first run this process
    }

    return fetchNewFaucetAccount();
};

const activateAccount = async (address) => {
    const Connection = new XrplClient('wss://xahau-test.net');

    await Connection.ready();

    try {
        for (let round = 0; round < 3; round++) {
            const fundedAccount = await generateTestnetAccount();
            const accountInfo = await Connection.send({
                command: 'account_info',
                account: fundedAccount.address,
            });

            const balance = accountInfo.account_data ? Number(accountInfo.account_data.Balance) : 0;
            if (!accountInfo.account_data || balance < MIN_FUND_BALANCE) {
                await fetchNewFaucetAccount();
                continue;
            }

            const Transaction = {
                TransactionType: 'Payment',
                Account: fundedAccount.address,
                Destination: address,
                Amount: String(ACTIVATION_DROPS),
                Fee: String(ACTIVATION_FEE_DROPS),
                NetworkID: 21338,
                Sequence: accountInfo.account_data.Sequence,
            };

            const signedObject = AccountLib.sign(Transaction, AccountLib.derive.familySeed(fundedAccount.secret));

            const submitResult = await Connection.send({
                command: 'submit',
                tx_blob: signedObject.signedTransaction,
            });

            if (submitResult.engine_result === 'tecUNFUNDED_PAYMENT') {
                await fetchNewFaucetAccount();
                continue;
            }

            if (submitResult.engine_result !== 'tesSUCCESS') {
                throw new Error(`activation payment failed: ${submitResult.engine_result}`);
            }

            // only return once the destination account actually exists on ledger
            for (let attempt = 0; attempt < 10; attempt++) {
                await sleep(3000);
                const destinationInfo = await Connection.send({
                    command: 'account_info',
                    account: address,
                });
                if (destinationInfo.account_data) {
                    return;
                }
            }

            throw new Error('activation payment did not validate in time');
        }

        throw new Error('activation payment failed: tecUNFUNDED_PAYMENT');
    } finally {
        Connection.close();
    }
};

module.exports = {
    activateAccount,
    generateTestnetAccount,
    generateFreshTestnetAccount,
    generateSecretNumbers,
    generateFamilySeed,
    generateMnemonic,
    deriveMnemonicAddress,
    deriveFamilySeedAddress,
    SAMPLE_24_WORD_MNEMONIC,
    SAMPLE_FAMILY_SEED_ED_XAHAU,
    SAMPLE_FAMILY_SEED_ED_ADDRESS,
    SAMPLE_FAMILY_SEED_SECP_ADDRESS,
};
