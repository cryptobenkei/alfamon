import * as geekABI from '../artifacts/contracts/GeekART.sol/GeekART.json'
import { createPublicClient, http, parseEventLogs } from "viem";
import { baseSepolia } from 'viem/chains'
import { Network, Alchemy } from "alchemy-sdk";
import dotenv from "dotenv";
dotenv.config();
const settings = {
  apiKey: process.env.APIKEY_SEPOLIA,
  network: Network.BASE_SEPOLIA
};
const topicMinted = '0xffcef012c57aebe5ac5892b7a52a23e54435ab8349cfbaa6620d7f3b0da0a001';

const alchemy = new Alchemy(settings);

const main = async () => {
    console.log('Listening for events...');
    const publicClient = createPublicClient({ 
      chain: baseSepolia,
      transport: http(process.env.RPC_SEPOLIA)
    })
  
    // Create the log options object.
    const nftEvents = {
        address: process.env.GEEKART,
        topics: [],
    };
  
  // TODO: Add whatever logic you want to run upon mint events.
  const processEvent = async (txn: any) => {


    const receipt = await publicClient.getTransactionReceipt({
      hash: txn.transactionHash,
    })
    const logs = parseEventLogs({ 
      abi: geekABI.abi, 
      logs: receipt.logs
    })
    for (let i=0; i<logs.length; i++) {
      const log:any = logs[i];
      console.log(log.eventName, log.args);
      switch (log.eventName) {
        case 'Minted':
          console.log(`Minted NFT with tokenId: ${log.args?.listingId}`);    
          break;
          case 'BidCreated':
            console.log(`Bid for tokenId: ${log.args?.listingId} for ${log.args?.price}`);
          break;
        default:
          break;
      }
    }
  }
  
  // Open the websocket and listen for events!
  alchemy.ws.on(nftEvents, processEvent);
};

const runMain = async () => {
  try {
    await main();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();