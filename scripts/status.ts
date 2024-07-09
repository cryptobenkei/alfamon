import { ethers } from "ethers";
import { loadConf, getContext, getBlockchain } from "./utils";
import { title, error, log } from "./utils/console"


async function main() {
  const confData = await loadConf();
  // const { confData, context, provider, wallet, domainName } = await getContext();
    // Get information from context and load documents (verify).
  const { address, context, domainName  } = await getContext(true);

  const { collectionContract, flexmarketContract, wallet } = await getBlockchain(context, confData.chainId, address, true);
  const doc = await context.document(`${domainName}/${confData.path}`);

  title(`Status NFT ${domainName}`)
  log('NFT Address      : ', address);
  /*
  log('NFT Minter       : ', doc.data.minter);
  log('Wallet Address   : ', (wallet.address !== '') ? wallet.address : 'Not deployed');
  log('Balance          : ', (wallet.address !== '') ? ethers.formatEther(await provider.getBalance(wallet.address)) : 'Not deployed');
  log('Total Supply     : ', doc.data.totalSupply);
  log('Available        : ', doc.data.toMint);
  log('Price            : ', doc.data.price);

  title(`Document ${confData.path}`);
  log('Version          : ', doc.versionNumber);
  log('Name             : ', doc.data.name);
  log('Description      : ', doc.data.description);
  log('Image            : ', doc.data.image);

  if (process.argv[2]) {
    const tokenId = parseInt(process.argv[2]);
    console.log(`${domainName}/${confData.path}/${tokenId}`);
    const doc = await context.document(`${domainName}/${confData.path}/${tokenId}`);
    console.log(doc.versionNumber);
    console.log(doc.data);
  } else {
    error('Please specify a tokenId to get the NFT details: npm status <tokenId>');
  }*/

}

main();