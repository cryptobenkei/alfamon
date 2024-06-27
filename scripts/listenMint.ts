// import { ethers } from "ethers";
import { getContext, getBlockchain, loadData, loadConf } from "./utils";
import { log, title, spinStart, spinStop } from "./utils/console";
import fs from "fs";

async function main() {

  // Load Configuration from /data/conf.json
  const confData = await loadConf();

    // Get information from context and load documents (verify).
    const { address, context, domainName, collectionDocument  } = await getContext(true);
  
    // get Blockchain (and verify)
    const { collectionContract } = await getBlockchain(context, confData.chainId, address, true);

  // Mint an NFT.
  title(`Listen to NFT Minted events ${confData.path}`)
  collectionContract.on("Minted", async (tokenId, dropId) => {
    title(`Create NFT ${tokenId} from drop ${dropId}`);

    // Load data from the drop.
    const dropData: any = loadData(`./data/drops/${dropId}.json`)
    console.log(dropData);

    // get the document.
    const dropName = dropData.dropName;
    const dropresult = await context.document(`${domainName}/drops/${dropName}`)
    if (!dropresult.success) return;
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
        "value": "0"
      }, {
        "trait_type": "level",
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
    log('Drop metadata        : ', `https://app.ctx.xyz/d/${domainName}/drops/${dropName}` )
  });
}

main();