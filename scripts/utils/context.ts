import { Context, Domain } from '@contextprotocol/sdk';
import { ethers, ContractFactory, Contract } from "ethers";
import * as collectionABI from '../../artifacts/contracts/NFTCollection.sol/NFTCollection.json';
import * as marketABI from '../../artifacts/contracts/NFTMarketSell.sol/NFTMarketSell.json';
import * as mintABI from '../../artifacts/contracts/NFTMint.sol/NFTMint.json';

import dotenv from 'dotenv'
// import { collectionUrl } from '../../metadata';
import { error, loadData } from './index'
dotenv.config();

/**
 * @async
 * @function getContext
 * @description This function initializes the context for interacting with the blockchain and the NFT marketplace.
 * It retrieves necessary environment variables, sets up the blockchain clients, and returns an object with all the necessary data.
 * 
 * @returns {Promise<Object>} An object containing the context, public client, wallet client, NFT and market addresses, account, and ABIs for the collection and market contracts.
 */
async function getContext(init: boolean = false)  {
  // return params.
  let document;
  let nftCollection: Contract | null = null;
  let nftMarket: Contract | null = null;
  let nftMint: Contract | null = null;

  // Retrieve the API key from the environment variables
  if (!process.env.CONTEXT_APIKEY || process.env.CONTEXT_APIKEY === '') {
    error('Setup your Context API_KEY in .env');
  }
  const apiKey = process.env.CONTEXT_APIKEY as string;

  // Retrieve the blockchain RPC from the environment variables
  if (!process.env.BLOCKHAIN_RPC || process.env.BLOCKHAIN_RPC === '') {
    error('Setup your Blockhcain RPC in .env');
  }
  const blockchainRPC = process.env.BLOCKHAIN_RPC;

  // Retrieve the private key from the environment variables
  if (!process.env.WALLET_PRIVKEY || process.env.WALLET_PRIVKEY === '') {
    error('Setup your Private Key in .env');
  }
  const privateKey: `0x${string}` = `0x${process.env.WALLET_PRIVKEY}` as `0x${string}` || '0x';
  const provider = new ethers.JsonRpcProvider(blockchainRPC)
  const wallet = new ethers.Wallet(privateKey, provider)
  const factory = new ContractFactory(collectionABI.abi, collectionABI.bytecode, wallet);
  const factoryMarket = new ContractFactory(marketABI.abi, marketABI.bytecode, wallet);
  const factoryMint = new ContractFactory(mintABI.abi, mintABI.bytecode, wallet);
  
  // Initialize the context with the API key
  const context = new Context({ apiKey });
  const result = await context.domain();
  if (!result || "error" in result) {
    error('Invalid API_KEY in .env');
  }
  const domain: Domain = result;
  
  // Load configuration file
  const confData = loadData('./data.json');
  
  if (!confData && init === false) error('No configration, execute "npm run init"');
  let nftPath = `https://rpc.ctx.xyz/${domain.name}`
  if (confData) {
    nftPath = `${nftPath}/${confData.path}`
    try {
      document = await context.document(`${domain.name}/${confData.path}`);
      confData.totalSupply = document.data.totalSupply;
    } catch (_e) {
      document = null;
    }

    // Get the Contract.
     if (confData && confData.address) {
      nftCollection = new ethers.Contract(confData.address, collectionABI.abi, wallet);
     }

      // Get the Contract (minter)
     if (confData && confData.minter) {
      nftMint = new ethers.Contract(confData.minter, mintABI.abi, wallet);
     }
    
    // Get the Contract (market)
    if (confData && confData.marketSell) {
      console.log(confData);
      nftMarket = new ethers.Contract(confData.marketSell, marketABI.abi, wallet);
    }
  }
  // Return an object with all the necessary data
  return {
    context,
    domainName: domain?.name || '',
    document,
    nftPath,
    wallet,
    provider,
    factory,
    factoryMarket,
    factoryMint,
    confData,
    nftCollection,
    collectionABI,
    nftMarket,
    marketABI,
    nftMint,
    mintABI
  }
}

export default getContext;