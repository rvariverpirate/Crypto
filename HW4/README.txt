Overview:
Tripp Coin is a BlockChain built in javascript for easy integration with websites.
It implements the SHA256 algorithm as a hash function.
For public key infrastructure TrippCoin utilizes Elliptic Curve algorithms for continued
security into the future. Customers and merchants simply generate their own public/private
keys via Elliptic Curve algorithm. Once their keys have been established a they can apply
their digital signatures to a transaction. A hash of the transaction is then addded and
the transaction is then signed by a miner. Finally, the entire block is added to the 
block chain and linked to the previous block by it's hash.

Proof of Work:
In order to maintian provide a proof of work the BlockChain imposes "difficulties" 
that define what valid hashes will be accepted. This code allows for a difficulty 
of up to 16-bits. Here the  difficulty is defined as the number of leading zeros
of the blocks resultant hash. The hash for each block is caluclated utilizing the 
SHA256 hashing algorightm over the concatenation of the previous blocks hash, a Nonce, the
transaction information and the blocks sequence number. Miners perform a brute force attempt to
find the 'golden nonce' by itteratily incrementing the nunce untill a hash that 
meets the criteria imposed by the difficulty is found.