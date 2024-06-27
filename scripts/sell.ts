import { ethers, parseEther } from "ethers";
import { getContext, title, spinStart, spinStop } from "./utils";

async function main(tokenId: string) {
  const { document, confData, context, nftCollection, nftMarket, wallet, domainName } = await getContext();

  // Mint an NFT.
  title(`Sell NFT ${confData.path} #${tokenId}`)

  // A document for the Collection must be stored in Context.
  if (!document.data) {
    console.log('Document has not been created')
    process.exit();
  }

  let owner = await nftCollection.ownerOf(tokenId);
  if (owner !== wallet.address ){
    console.log('You can only sell the NFTs you own')
    process.exit();
  }
  
    // get NFT metadata
  const nft = await context.document(`${domainName}/${confData.path}/${tokenId}`);
  spinStart('Sell NFT - sending to the Buy Contract');
  let tx = await nftCollection.approve(confData.marketSell, tokenId);
  await tx.wait();
  const price = parseEther("0.001");
  tx = await nftMarket.addSell(wallet.address, tokenId, price);
  await tx.wait();
  spinStop();

  // Upload new asset : Contract image
  title(`Update NFT metadata #${tokenId}`);
  spinStart('Updating NFT metadata');
  const nftData = {...nft.data};
  nftData.action = 'buy';
  nftData.price = price.toString();
  console.log(nftData);
  let  res = await nft.update(nftData);
  console.log(res);
  spinStop();

  title(`Update metadata ${confData.path}`);
  spinStart('Updating Contract metadata');
  const collectionData = {...document.data}
  collectionData.availableToBuy = (collectionData.availableToBuy) ? 1 : collectionData.availableToBuy + 1;
  res = await document.update(collectionData);
  console.log(res);
  spinStop();

  title('NFT metadata created successfully');
}

main(process.argv[2]);