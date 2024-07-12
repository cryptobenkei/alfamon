import { cast } from "./neynar";
import { getContext, getBlockchain, loadData, loadConf } from "../scripts/utils";
import { log, title } from "../scripts/utils/console";

import fs from "fs";
import { updateTx } from './mongodb';

export const levelUp = async(tokenId) => {
  const confData = await loadConf();
  const { context, domainName } = await getContext(true);
  const result = await context.document(`${domainName}/${confData.path}/${tokenId}`);
  if (result.success && result.data) {
    try {
      const nft = result.data;
      console.log('Update NFT!');
      const newData: any = {...nft.data};
      const level = newData.level ?  + newData.level + 1 : 1;
      newData.level = level;
      newData.image = `https://rpc.ctx.xyz/${domainName}/assets/level${level}`;
      console.log(newData);
      await nft.update(newData);
      log('NFT updated!', 'success');
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  } else return false;

}
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
  const newTokenId = tokenId;
  const nftData = {
    "name": confData.drops[dropName].nftName.replace('${tokenId}', newTokenId),
    "description": confData.drops[dropName].nftDescription.replace('${tokenId}', newTokenId),
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
  const nftMetadata = await context.document(`${domainName}/${confData.path}/${newTokenId}`)
  if (nftMetadata.success === false) {
    log('Storing metadata to Context', 'waiting');
    const res = await context.createDocument( `${confData.path}/${newTokenId}`, nftData, [] );
    log('NFT metadata         : ', `https://app.ctx.xyz/d/${domainName}/${confData.path}/${tokenId}` )
  }

  // Step Two : update the drop (metadata)
  log('Updating NFT Collection metadata', 'waiting');
  let data = {...collectionDocument.data}
  data.totalSupply = data.totalSupply + 1;
  await collectionDocument.update(data);
  log('Collection metadata  : ', `https://app.ctx.xyz/d/${domainName}/${confData.path}` )

  fs.writeFileSync(`./data/nfts/${tokenId}.json`, JSON.stringify(nftData));

  // Step three : update the NFT (metadata).
  log('Updating NFT Drop metadata', 'waiting');
  data = {...dropDocument.data}
  data.totalMinted = data.totalMinted + 1;
  await dropDocument.update(data);
  const owner = await collectionContract.ownerOf(tokenId);
  await updateTx(db, transactionId, tokenId, owner);
 
  log('Drop metadata        : ', `https://app.ctx.xyz/d/${domainName}/drops/${dropName}` )
  const urlMetadata = `https://app.ctx.xyz/d/${domainName}/drops/${dropName}`;

  let nft = await db.nftCollection.findOne({transactionId});
  if (nft && nft.requesterId) {
    await cast(nft.requesterId, urlMetadata);
  }
});
  };