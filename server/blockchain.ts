import { cast } from "./neynar";
import { getContext, getBlockchain, loadData, loadConf } from "../scripts/utils";
import { log, title, spinStart, spinStop } from "../scripts/utils/console";

import fs from "fs";
import { updateTx } from './mongodb';

export const listenToBlockchainEvents = async (db: any) => {
    console.log('Listening to blockchain events...');
    // Add logic to listen to blockchain events here
    // Load Configuration from /data/conf.json
  const confData = await loadConf();

  // Get information from context and load documents (verify).
  const { address, context, domainName, collectionDocument  } = await getContext(true);
  if (collectionDocument === null) process.exit();

  // get Blockchain (and verify)
  const { collectionContract } = await getBlockchain(context, confData.chainId, address, true);
  if (collectionContract === null) process.exit();

// Listen to NFT Minted events.
title(`Listen to NFT Minted events ${confData.path}`)

collectionContract.on("Minted", async (tokenId, dropId, event) => {
  // console.log(event);
  title(`Create NFT ${tokenId} from drop ${dropId}`);
  const transactionId = event.log.transactionHash;
  console.log("transactionId : " + transactionId);

  // Load data from the drop.
  const dropData: any = loadData(`./data/drops/${dropId}.json`)
  const dropName = dropData.dropName;

  // get the document.
  const dropresult = await context.document(`${domainName}/drops/${dropName}`)
  if (!dropresult.success) process.exit();
  const dropDocument = dropresult.data;
  
  // Step One : create the metadata for the new NFT
  const nftData = {
    "name": confData.drops[dropName].nftName.replace('${tokenId}', tokenId),
    "description": confData.drops[dropName].nftDescription.replace('${tokenId}', tokenId),
    "image": dropDocument.data.image.replace('ctx:', 'https://rpc.ctx.xyz/'),
    "action": "none",
    "price": 0,
    "attributes": [{
      "trait_type": "gen",
      "value": 0
    }, {
      "trait_type": "day",
      "value": 1
    } ]
  };

  // Create new document.
  console.log(`${confData.path}/${tokenId}`);
  spinStart('Storing metadata to Context');
  const res = await context.createDocument( `${confData.path}/${tokenId}`, nftData, [] );
  console.log(res);
  spinStop();
  log('NFT metadata         : ', `https://app.ctx.xyz/d/${domainName}/${confData.path}/${tokenId}` )

  // Step Two : update the drop (metadata)
  spinStart('Updating NFT metadata');
  let data = {...collectionDocument.data}
  data.totalSupply += 1;
  await collectionDocument.update(data);
  spinStop();
  log('Collection metadata  : ', `https://app.ctx.xyz/d/${domainName}/${confData.path}` )

  fs.writeFileSync(`./data/nfts/${tokenId}.json`, JSON.stringify(nftData));

  // Step three : update the NFT (metadata).
  spinStart('Updating NFT metadata');
  data = {...dropDocument.data}
  data.totalMinted += 1;
  await dropDocument.update(data);
  spinStop();
  await updateTx(db, transactionId, tokenId);
  log('Drop metadata        : ', `https://app.ctx.xyz/d/${domainName}/drops/${dropName}` )
  const urlMetadata = `https://app.ctx.xyz/d/${domainName}/drops/${dropName}`;
  await cast(8691, urlMetadata);
});
  };