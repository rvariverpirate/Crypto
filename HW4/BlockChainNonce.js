const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const { performance } = require('perf_hooks'); //object destructuring



// Class for individual transactions including signatures
class Transaction{
    constructor(customerPubKey, merchantPubKey, amount){
        this.customerPubKey = customerPubKey;// Field 1
        this.merchantPubKey = merchantPubKey;// Field 2
        let date = new Date(Date.now());
        this.transDate = date.getMonth() + date.getDate() + date.getYear();// Field 3
        this.amount = amount;// Field 4
        this.customerSignature;// Field 5
        this.merchantSignature;// Field 6
    }

    // Apply the Customers Signature
    CustomerSign(customerPrivKey){
        // Concatenate all data together into a single string
        let fields = this.customerPubKey;// Field 1
        fields += this.merchantPubKey;// Field 2
        fields += this.transDate;// Field 3
        fields += this.amount;// Field 4

        // Get the one-way hash of this string
        let hash = SHA256(fields);

        // Encrypt the Hash with the Private Key
        this.customerSignature = customerPrivKey.sign(hash.words);
    }

    // Apply the Merchants Signature
    MerchantSign(merchantPrivKey){
        // Concatenate all data together into a single string
        let fields = this.customerPubKey;// Field 1
        fields += this.merchantPubKey;// Field 2
        fields += this.transDate;// Field 3
        fields += this.amount;// Field 4
        fields += this.customerSignature;// Field 5

        // Get the one-way hash of this string
        let hash = SHA256(fields);
        // Encrypt the Hash with the Private Key
        this.merchantSignature = merchantPrivKey.sign(hash.words);
    }
}

class Miner{
    constructor(){
        this.privateKey = ec.genKeyPair();
        this.publicKey = this.privateKey.getPublic();
    }

    signTransaction(transaction){
        let customerSignature = transaction.customerSignature;
        let merchantSignature = transaction.merchantSignature;
        let content = { customerSignature, merchantSignature};
        let hash = SHA256(content);
        return this.privateKey.sign(hash.words);
    }
}

class Block{
    constructor(index, data, previousHash, minerSignature, difficulty){
        this.data = data;// Fields 1-6 Transaction
        this.index = index;// Field 7 Block Sequence Number (added by Miner)
        this.previousHash = previousHash;// Field 8 (added by Miner)
        this.minerSignature = minerSignature;// Field 9 (added by Miner)
        this.nonce = new Uint8Array(16).fill(0);
        this.difficulty = difficulty;
        this.hash = this.calculateHash();
        this.hexDict = {'0':0, '1':1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8,
            '9':9, 'a':10, 'b':11, 'c':12, 'd':13, 'e':14, 'f':15};
    }

    // Convert our Nonce (Unit8 ByteArray) to a Hex String
    nonceToHexString(){
        return Array.from(this.nonce, (byte) => {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2)
        }).join('');
    }

    leadingZeroBitsToMax(){
        // We really only need to calculate this once in the constructor
        // Exammple: 3 leading zeros
        // 000xx xxxx xxxx xxxx
        // must be less than
        // 111xx xxxx xxxx xxxx
        // Max Value = 1111 1111 1111 1111 - 1110 0000 0000 0000
        // We only need up to 15 bits
        let maxVal = 0;
        // Count down from 15 to (15-difficulty + 1)
        // let difficulty = 3
        // (15-3) + 1 = 13 => 15, 14, 13 => 1110 0000 0000 0000
        for(let bitLoc=15; bitLoc>15 - this.difficulty; bitLoc--){
            maxVal+= Math.pow(2, bitLoc);
        }
        return Math.pow(2, 16) - maxVal;// We need to stay under this value
    }

    // Used to convert the first two chars (MSB's) of hash into an integer value
    hexStrToInt(){
        let byteA = this.hash[0];// 16^3's
        let byteB = this.hash[1];// 16^2's
        let byteC = this.hash[2];// 16^1's
        let byteD = this.hash[3];// 16^0's
        return 4096*this.hexDict[byteA] + 256*this.hexDict[byteB] + 16*this.hexDict[byteC] +  this.hexDict[byteD];
    }

    // Perform SHA256 hash over (previous block hash || Nonce || fields 1-7)
    calculateHash(){
        // Fields 1-7: (1-6) Transaction, (7) Sequence Number
        //console.log(`Hash Input: ${this.previousHash + this.nonceToHexString() + JSON.stringify(this.data) + this.index}`)
        return SHA256(this.previousHash + this.nonceToHexString() + JSON.stringify(this.data) + this.index).toString();
    }

    // Used to increment our nonce byte array, carring overflow values to the next byte
    incrementNonce(){
        let cary = 1;
        let nonceLength = this.nonce.length;
        for(let i=0; i<nonceLength; i++){
            let prev = this.nonce[i];
            this.nonce[i] += cary;
            cary = prev > this.nonce[i] ? 1 : 0;
        };
    }

    // Verifiies that hash meets difficulty requirement "Proof of Work"
    validateHash(){
        // Our code produces a hex string so we need to first convert them to numeric and set bounds
        // HEX: 0,1,2,3,4,5,6,7,8,9,a,b,c,d,e,f
        let leadingValue = this.hexStrToInt();// This is the two MSB from our hex string hash
        let tooHigh = this.leadingZeroBitsToMax();// We must be under this number for the Proof of Work
        if(leadingValue >= tooHigh){
            return false;
        }
        return true;
    }

    // Brute force a solution to determine the minumum Nonce that meets difficulty requirement
    calculateNonceHash(){
        let runTime = performance.now();
        this.hash = this.calculateHash();
        let count = 1;
        while(!this.validateHash()){
            this.incrementNonce();
            this.hash = this.calculateHash();
            count ++;
        }
        runTime = performance.now() - runTime;
        let output = `Difficulty# ${this.difficulty} Block# ${this.index}`;
        output += ` # of Nonces Attempted ${count} Computaion time ${runTime} (ms)\n`;
        console.log(output);
    }
}

// The Block Chain itself
class BlockChain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock(){
        return new Block(0, "11/06/1988", "Genesis block", "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length-1]
    }

    addBlock(newBlock){
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.calculateNonceHash();
        this.chain.push(newBlock);
    }

    isChainValid(){
        for(let i=1; i<this.chain.length; i++){
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];
            if(currentBlock.hash != currentBlock.calculateHash()){
                return false;
            }
            if(currentBlock.previousHash != previousBlock.calculateHash()){
                return false;
            }
        }
        return true;
    }
}

// Generate a Random integer between min and max
function RandInt(min, max){
    let range = max - min;
    return Math.round(Math.random()*range) - min;
}

// Create a Customer Class
class Customer{
    constructor(id){
        this.id = id;
        let key = ec.genKeyPair();
        this.privateKey = key;
        this.publicKey = key.getPublic();;
    }
}

// Create a Merchant Class
class Merchant{
    constructor(id){
        this.id = id;
        let key = ec.genKeyPair();
        this.privateKey = key;
        this.publicKey = key.getPublic();;
    }
}

// Create a list of 5 Customers
let customers = [];
for(let i=0; i<5; i++){
    let customer = new Customer(i);
    customers.push(customer);
}

// Create a list of 2 Merchants
let merchants = [];
for(let i=0; i<2; i++){
    let merchant = new Merchant(i);
    merchants.push(merchant);
}

// Instantiate a Coin Miner
var pickAxe = new Miner();

// Implement the Block Chain
let trippCoin = new BlockChain();

// Assign the various levels of Diffifuclty
let difficulties = [0, 5, 10];

// Number of Transactions to Generate at each level
let numTransactions = 25;
let transactions = [];

difficulties.forEach((diff) => {
    // Generate 25 Random Transactions
    transactions = [];
    for(let i=0; i<=numTransactions; i++){
        let amount = RandInt(0, 300);
        let merchant = merchants[RandInt(0, merchants.length - 1)];
        let customer = customers[RandInt(0, customers.length - 1)];
        let transaction = new Transaction(customer.publicKey, merchant.publicKey, amount);

        // Apply Customer and Merchant Signatures
        transaction.CustomerSign(customer.privateKey);
        transaction.MerchantSign(merchant.privateKey);

        transactions.push(transaction);
        let previousHash = trippCoin.chain[i];
        let minerSignature = pickAxe.signTransaction(transaction);
        let block = new Block(i + 1, transaction, previousHash, minerSignature, diff);
        trippCoin.addBlock(block);
    }
})

//console.log("\n\n");
// (1) Print Transactions 1-4
//console.log("(1)");
for(i=0; i<4; i++){
    let transaction = transactions[i];
    /*console.log("Merchant Public Key: ", JSON.stringify(transaction.merchantPubKey));
    console.log("Customer Public Key: ",  JSON.stringify(transaction.customerPubKey));
    console.log("Transaction Date: ",  transaction.transDate);
    console.log("Amount: ",  transaction.amount);
    console.log("\n");*/
}

// (2) Increment Ammount of Tranaction #15 by 
//console.log("(2)")
let blockIdx = 15;
//console.log("Original Amount =  ", trippCoin.chain[blockIdx].data.amount);
// Check the validity of the BlockChain
//console.log(trippCoin.chain[blockIdx], "\n\n");
//console.log("Block Chain Validity = ", trippCoin.isChainValid());
//console.log("\n\n");

// Tamper with the data
trippCoin.chain[2].data.amount += 10;
//console.log("Tampered Amount = ", trippCoin.chain[blockIdx].data.amount);
// Check the validity of the BlockChain
//console.log(trippCoin.chain[blockIdx], "\n\n");
//console.log("Block Chain Validity = ", trippCoin.isChainValid());

// (3) Search Through the Blockchain and print all transactions for Customer #3
/*console.log("(3)");
console.log("\n\n Customer # 3 Transactions: ");*/
customer3PubSig = customers[2].publicKey;
trippCoin.chain.forEach((block) => {
    if(block.data.customerPubKey == customer3PubSig){
        let transaction = block.data;
        /*console.log("Merchant Public Key: ", JSON.stringify(transaction.merchantPubKey));
        console.log("Customer Public Key: ",  JSON.stringify(transaction.customerPubKey));
        console.log("Transaction Date: ",  transaction.transDate);
        console.log("Amount: ",  transaction.amount);
        console.log("\n");*/
    }
});

// (4) Search Through the Blockchain and print all transactions for Merchant #2
/*console.log("(4)");
console.log("\n\n Merchant # 2 Transactions: ");*/
merchant2PubSig = merchants[1].publicKey;
trippCoin.chain.forEach((block) => {
    if(block.data.merchantPubKey == merchant2PubSig){
        let transaction = block.data;
        /*
        console.log("Merchant Public Key: ", JSON.stringify(transaction.merchantPubKey));
        console.log("Customer Public Key: ",  JSON.stringify(transaction.customerPubKey));
        console.log("Transaction Date: ",  transaction.transDate);
        console.log("Amount: ",  transaction.amount);
        console.log("\n");
        */
    }
});