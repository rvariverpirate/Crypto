# -*- coding: utf-8 -*-
"""
Created on Sat Jan 25 22:51:09 2020

@author: cannellajs2
"""
################
# Question 1   #
# Merkel Trees #
################
import hashlib, json
from collections import OrderedDict
import math


# Given:
plainTextList = ["POT", "PIE", "CAT", "COW", "RAT", "OWL", "YAK"]

def countBitsSet(ordValue):
    count = 0
    while(ordValue):
        count += ordValue & 1
        ordValue >>= 1
    return count

# Take a string and loop over each character and sum number of bits set
def getStringHash(inString):
    totalBitsSet = 0
    for char in inString:
        # Convert each char to ordinal (integer) representation
        ordVal = ord(char)
        # Count the number of bits set in the integer
        charBitsSet = countBitsSet(ordVal)
        # Add number of bits to total
        totalBitsSet += charBitsSet
    return totalBitsSet%15

# Used to comute the hash of two hashes
def getIntHash(leftVal, rightVal):
    return (countBitsSet(leftVal) + countBitsSet(rightVal))%15

# Test 1
potHash = getStringHash("POT")
print(potHash)

# Create a node class
class Node:
    def __init__(self, hashValue):
        self.left = None
        self.right = None
        self.parent = None
        self.hashVal = hashValue

# Determine number of leafs for "balanced tree"
def balanceTree(leafs):
    leafsRequired = 2**(math.ceil(math.log(len(leafs), 2)))
    dummyLeaf = Node(0);
    numLeafsToAdd = leafsRequired - len(leafs)
    for i in range(0, numLeafsToAdd):
        leafs.append(dummyLeaf)
    return leafs
        
    

# Loop over list elements, get their hashes, add to map and array
def createLeafs(wordList):
    leafList = []
    leafMap = {}
    for word in wordList:
        wordHash = getStringHash(word)
        leaf = Node(wordHash)
        leafMap[word] = leaf
        leafList.append(leaf)
    return leafList, leafMap

# Recursivly Build the tree starting with a list of leafs
def buildTree(nodes):
    parentArray = []
    if(len(nodes) != 1):
        for i in range(0, len(nodes), 2):# Move in increments of 2
            parentHash = getIntHash(nodes[i].hashVal, nodes[i+1].hashVal);
            parent = Node(parentHash)
            nodes[i].parent = parent
            nodes[i+1].parent = parent
            parent.left = nodes[i]
            parent.right = nodes[i+1]
            parentArray.append(parent)
        buildTree(parentArray)
        
# Create Leaf Nodes and Map Plaintext to them
leafList, leafMap = createLeafs(plainTextList)

# Make sure our Tree will be balanced
leafList = balanceTree(leafList)

# Build the Tree Recursively
buildTree(leafList)


# Need either global or class varibles to do this effectively
copath = []# Track the hashes needed to verify results
visited = {}# Make sure we only vistit nodes once

def copathRecurse(node, traveledUp):
    visited[node] = True;
    if(traveledUp):
        if(node.left != None and node.left not in visited):
            print("Searching Left")
            copath.append(node.hashVal)
            return copathRecurse(node.left, False)
        elif(node.right != None and node.right not in visited):
            print("Searching Right")
            copath.append(node.hashVal)
            return copathRecurse(node.right, False)
    if(node.parent != None):
        print("Searching Parent")
        return copathRecurse(node.parent, True)



# Create Function that Given an string will return the copath if it is in the tree
def populateCopath(word):
    if word in leafMap:
        leaf = leafMap[word]
        copath.append(leaf.hashVal)
        copathRecurse(leaf, False)
    else:
        return None
        
# Perform the Actual Query
populateCopath("PIE")

print(copath)
print(visited)

# Check Hash


##############
# Question 2 #
##############

################
# DES Section #
###############
"""
from Crypto.Cipher import DES


# 8-Byte Key
sym_key = b'LoveDogs'
data = b'this is total crap'

# Create the encryption Cipher
e_cipher = DES.new(sym_key, DES.MODE_CFB)

# Want to include the initialization vector
iv = e_cipher.iv

# Encrypt the Data
e_data = iv + e_cipher.encrypt(data)

# Create Decryption Cipher
d_cipher = DES.new(sym_key, DES.MODE_CFB)

# Decrypt the Data
d_data = d_cipher.decrypt(e_data)

print("Enrypted Data: ", e_data)
print("Decrypted Data: ", d_data)
"""
###############
# RSA Section #
###############
"""from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA

# Data to Encrypt
data = "I met aliens in UFO. Here is the map.".encode("utf-8")

# Generate Keys
key = RSA.generate(2048)

# Private Key
private_key = key.export_key()

# Private Key
public_key = key.publickey().export_key()
file_out = open("receiver.pem", "wb")
file_out.write(public_key)

file_out = open("encrypted_data.bin", "wb")

recipient_key = public_key#RSA.import_key(open("receiver.pem").read())
session_key = get_random_bytes(16)

# Encrypt the session key with the public RSA key
cipher_rsa = PKCS1_OAEP.new(recipient_key)
#enc_session_key = cipher_rsa.encrypt(session_key)

# Encrypt the data with the AES session key
cipher_aes = AES.new(session_key, AES.MODE_EAX)
ciphertext, tag = cipher_aes.encrypt_and_digest(data)
#RSA.import_key(open("private.pem").read())


# Decrypt the session key with the private RSA key
cipher_rsa = PKCS1_OAEP.new(private_key)
#session_key = cipher_rsa.decrypt(enc_session_key)

# Decrypt the data with the AES session key
data = cipher_aes.decrypt_and_verify(ciphertext, tag)
print(data.decode("utf-8"))"""

"""
# Verbatum....
from Crypto.PublicKey import RSA

key = RSA.generate(2048)
private_key = key.export_key()
file_out = open("private.pem", "wb")
file_out.write(private_key)

public_key = key.publickey().export_key()
file_out = open("receiver.pem", "wb")
file_out.write(public_key)


from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES, PKCS1_OAEP

data = bytes("I met aliens in UFO. Here is the map.", encoding="utf8")
file_out = open("encrypted_data.bin", "wb")

recipient_key = RSA.import_key(open("receiver.pem").read())
session_key = bytes(get_random_bytes(16))

# Encrypt the session key with the public RSA key
cipher_rsa = PKCS1_OAEP.new(recipient_key)
enc_session_key = cipher_rsa.encrypt(session_key)

# Encrypt the data with the AES session key
cipher_aes = AES.new(session_key, AES.MODE_EAX)
ciphertext, tag = cipher_aes.encrypt_and_digest(bytes(data))
[ file_out.write(x) for x in (enc_session_key, cipher_aes.nonce, tag, ciphertext) ]
"""