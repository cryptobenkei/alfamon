import { ethers, ContractFactory } from 'ethers';
import { log, error } from "./console";
import { Context, Domain, Document } from '@contextprotocol/sdk';
import * as collectionABI from "../../artifacts/contracts/NFTCollection.sol/NFTCollection.json";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

// Function to load data
function loadConf(): any {
    const filePath ="./data/config.json";
    let jsonData: any = null;

    if (fs.existsSync(filePath)) {
      const json = fs.readFileSync(filePath, 'utf-8');
      jsonData = JSON.parse(json);
      if (jsonData.chain === '' || jsonData.name === '') {
        console.warn("Configure your NFT Collection")
        console.log("Edit all the fields to configure your NFT Collection\n")
        error('Edit ./data/config.json')
      }
      if (!jsonData.image || jsonData.image === 'test.png') {
        console.warn("Create the cover for your NFT Collection")
        console.log("1. Store it in ./data/assets/cover.png (or any name)")
        console.log("2. Update the conf.json file with only the name: cover.png\n")
        error('Edit ./data/config.json')
      } else if (!fs.existsSync(`./data/assets/${jsonData.image}`)) {
        console.warn("Create the cover for your NFT Collection");
        console.log("Select an image as a cover and store it in data/assets\n")
        error('Store the cover in ./data/assets')
      }
    } else {
      error('Invalid configuration file : ./data/config.json')
    }
    return jsonData;
  }

async function getDrop(context, domainName, confData, dropName, verify) {
  if (!confData.drops || !confData.drops[dropName]) {
    console.log("Edit data/config.json to add a drop");
    error(`Drop ${dropName} is not cofigured`);
  }
  const drop = confData.drops[dropName];
  let dropDocument = await context.document(`${domainName}/drops/${dropName}`)
  if (verify && !dropDocument.success) error('Drop has not been initialized');
  dropDocument = dropDocument.success ? dropDocument.data : null;

  const filePath =`./data/assets/${drop.image}`;
  if (!fs.existsSync(filePath)) {
    console.log(`Image data/assets/${drop.image} does not exist`);
    console.log("Add the image in data/assets and update data/config.json");
    error(`Drop ${dropName} is not cofigured`);
  }

  return { drop, dropDocument };
}

  /*
  * get The Context for the NFT
  */
async function getContext(verify: boolean = false ) {
    // Retrieve the API key from the environment variables
    if (!process.env.CONTEXT_APIKEY || process.env.CONTEXT_APIKEY === '') {
        error('Setup your Context API_KEY in .env');
    }
      
    // Initialize the context with the API key. Domain
    let collectionDomain: Domain;
    const context = new Context({ apiKey: process.env.CONTEXT_APIKEY as string });
    const resultDomain = await context.domain();
    if (resultDomain.success) collectionDomain = resultDomain.data as Domain;
    else error('Invalid API_KEY in .env');

    // Read the Document
    let collectionDocument : null | Document = null
    const resultDocument = await context.document(`${collectionDomain.name}/nft`);
    if (resultDocument.success) collectionDocument = resultDocument.data;
    else log('Document Not found : ', `${collectionDomain.name}/nft`);

    const address = (collectionDocument && collectionDocument.data ) ? collectionDocument.data.address : '';
    if (verify && address === '') {
      error('Collection not configured : npm run init')
    }
  
    return { context, collectionDomain, collectionDocument, address, domainName: collectionDomain.name };
}

async function getBlockchain(context, chainId, address = '', verify: boolean = false) {
    const blockchainRPC = process.env.BLOCKHAIN_RPC as string;
      // Retrieve the blockchain RPC from the environment variables
    if (!blockchainRPC || blockchainRPC === '') {
        error('Setup your Blockhcain RPC in .env => BLOCKHAIN_RPC');
    }
  
    // Retrieve chain information for flexmarket
    let flexmarket = await context.document('flexmarket');
    if (flexmarket.success) flexmarket = flexmarket.data;
    else error('Flexmarket does not exist');

    const id = chainId.toString();
    if (!flexmarket.data.chains[id]) error('This ChainId is not deployed for flexmarket');
    const flexMarketData = flexmarket.data.chains[id];

    // Retrieve the ABI of FlexMarket
    let flexmarketABI = await context.document(`flexmarket/abis/${chainId}`);
    if (flexmarketABI.success) flexmarketABI = flexmarketABI.data.data.abi;
    else error('Flexmarket ABI does not exist');

    
    // Retrieve the private key from the environment variables
    if (!process.env.WALLET_PRIVKEY || process.env.WALLET_PRIVKEY === '') {
        error('Setup your Private Key in .env');
    }
    const privateKey: `0x${string}` = `0x${process.env.WALLET_PRIVKEY}` as `0x${string}` || '0x';
    const provider = new ethers.JsonRpcProvider(blockchainRPC)
    const wallet = new ethers.Wallet(privateKey, provider);

    const flexmarketContract = new ethers.Contract(flexMarketData.address, flexmarketABI, wallet);
    let collectionContract: ethers.Contract | null = null;
    if (address !== '') {
        collectionContract = new ethers.Contract(address, collectionABI.abi, wallet);
    }

    if (verify && !collectionContract) {
      error('Deploy first the NFT Collection')
    }

    const collectionContractFactory = new ContractFactory(collectionABI.abi, collectionABI.bytecode, wallet);

    // let flexMarketMinterContract;
    return { provider, wallet, collectionContract, collectionContractFactory, collectionABI, flexmarketContract };
}

// Function to load data
function loadData(filePath: string): any {
  if (fs.existsSync(filePath)) {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } else {
    return null;
  }
}

export {
    getContext,
    getBlockchain,
    loadConf,
    loadData,
    getDrop
};