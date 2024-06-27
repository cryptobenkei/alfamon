import { parseEther } from "ethers";
import { loadConf, getContext, getBlockchain} from "./utils";
import { error, title, spinStart, spinStop, log } from "./utils/console";
import fs from "fs";

async function safeMint(collectionContract, to): Promise<{tokenId: string, transactionHash: string}> {
  return new Promise(async (resolve) => {
    let tx = await collectionContract.safeMint(to);
    const transactionHash = tx.hash;
    collectionContract.on("Minted", (tokenId)=> {
      resolve({tokenId: tokenId.toString() , transactionHash});
    });
    log('Mint ', 'wait for the tx...');
  })
}
async function main(nftName) {
  if (!nftName || nftName === '') {
    error("Invalid action : npm run drop <dropId>")
  }

  // Conf.
  const confData = await loadConf();
  const { context, domainName, collectionDocument  } = await getContext();
  const address = (collectionDocument && collectionDocument.data ) ? collectionDocument.data.address : '';
  if (address === '') {
    error('Collection not configured : npm run init')
    log('Document : ', collectionDocument.path);
  }

  if (!confData.nfts || !confData.drops[nftName]) {
    console.log("Edit data/config.json to add a NFT");
    error(`NFT ${nftName} is not cofigured`);
  }

  const nft = confData.drops[nftName];
  const { collectionContract, wallet } = await getBlockchain(context, confData.chainId, address);
  if (!collectionContract) {
    error('Deploy first the NFT Collection')
    process.exit();
  }

  const filePath =`./data/assets/${nft.image}`;
  if (!fs.existsSync(filePath)) {
    console.log(`Image data/assets/${nft.image} does not exist`);
    console.log("Add the image in data/assets and update data/config.json");
    error(`NFT ${nftName} is not cofigured`);
  }

  spinStart(`Mint NFT`);
  const tokenId = await safeMint(collectionContract, wallet.address);
  spinStop();

  spinStart(`Creating context document`);
  await context.createDocument(
    `nft/${tokenId}`,
    {
      name: nft.name,
      description: nft.description,
      attributes: nft.attributes,
      image: `ctx:${domainName}/assets/${tokenId}`
    },
    []
  );
  spinStop();

}

main(process.argv[2]);