import { CommandSucceededEvent } from "mongodb";
import { loadConf, getContext, getBlockchain, encrypt } from "./utils";
import { title, spinStart, spinStop, log } from "./utils/console";

/**
 * MAIN
 */
async function main() {
    
  // Load Configuration from /data/conf.json
  const confData = await loadConf();

  // Get information from context and load documents.
  const { address, context, domainName, collectionDocument  } = await getContext();

  // Get information from Blockchain.
  const { flexMarketPubKey, collectionContractFactory, collectionABI } = await getBlockchain(context, confData.chainId, address);

  title(`NFT Collection ${domainName}`);
  if (collectionDocument) logCollection(collectionDocument);

  if (collectionDocument && false) {
    console.log("Init");
    // await updateMetadata(context, confData, domainName, collectionDocument, flexMarketPubKey)
    // await await createLevels(context, confData, domainName);

  } else {
    // Deploy Smart Contract.
    console.log("\nDeploy & Update");
    if (collectionDocument !== null) {
      console.log(collectionDocument.data, confData)
    }
    
    // const nftAddress = await deploySmartContract(collectionContractFactory, domainName, confData);

    // Create the Asset (cover).
    // await createAsset(context, confData, domainName);

    // Create Document (metadata).
    // await createMetadata(context, confData, domainName, nftAddress, flexMarketPubKey)
    // await updateMetadata(context, confData, domainName, collectionDocument, flexMarketPubKey, nftAddress)
    await updateMetadata(context, confData, domainName, collectionDocument, flexMarketPubKey)

    // Store ABI.
    // await storeABI(context, domainName, collectionABI);
    // await updateABI(context, domainName, collectionABI);

    // await await createLevels(context, confData, domainName);
  }

  
}

/**
 * FUNCTIONS
 */
async function storeABI(context, domainName, collectionABI) {
  spinStart('Storing Contract ABI');
  await context.createDocument(`contracts/abi`,collectionABI,[]);
  spinStop();
  log('ABI       : ', `https://rpc.ctx.xyz/${domainName}/contracts/abi`);
}

async function updateABI(context, domainName, collectionABI) {
  spinStart('Updating Contract ABI');
  const document = await context.document(`${domainName}/contracts/abi`);
  const res = await document.data.update(collectionABI);
  spinStop();
  log('ABI       : ', `https://rpc.ctx.xyz/${domainName}/contracts/abi  => ${res.success ? 'success': 'fail'}`);
}

async function createMetadata(context, confData, domainName, nftAddress, flexMarketPubKey) {
  spinStart(`Creating NFT Contract Metadata in Context : ${confData.path}`);
  console.log(flexMarketPubKey);
    await context.createDocument(
      `${confData.path}`, {
        name: confData.name,
        symbol: confData.symbol,
        description: confData.description,
        chainId: confData.chainId,
        image: `https://rpc.ctx.xyz/${domainName}/assets/cover`,
        address: nftAddress,
        totalSupply: 0,
        webHookURL: confData.webHookURL,
        webHookSecret: confData.webHookSecret,
        actions: confData.actions
      },
      ['web3/templates/contract']
    );
  spinStop();
  log('Saved     : ', `https://app.ctx.xyz/d/${domainName}/nft`);
}

async function updateMetadata(context, confData, domainName, collectionDocument, flexMarketPubKey) {
  let data = {... collectionDocument.data };
  let res = { success: false };
  // data.totalSupply = 3;
  data.description = confData.description;
  data.website = "https://alfamon.xyz";
  data.actions = confData.actions;
  data.actions = confData.actions.map(action => {
  // data.dropId = "ctx:alfamon/drops/gen0day1";
    if (action.secret && action.secret !== '') {
        action.secret = encrypt(flexMarketPubKey, action.secret);
    }
    return action;
  });
  // data.chainId = confData.chainId;
  // data.webHookURL = await encrypt(flexMarketPubKey, confData.webHookURL);
  // data.webHookSecret = await encrypt(flexMarketPubKey, confData.webHookSecret);
  spinStart(`Updating NFT Contract Metadata in Context : ${confData.path}`);
    const document = await context.document(`${domainName}/nft`);
    res = await document.data.update(data);
  spinStop();

  const drop = await context.document(`${domainName}/drops/gen0day1`);
  if (drop.success && drop.data) {
    const dropDocument = drop.data;
    const dropData = {...dropDocument.data };
    // dropData.totalMinted = 3;
    dropData.description = confData.drops['gen0day1'].description;
    console.log(dropData);
    spinStart(`Updating NFT Drop Metadata in Context`);
    res = drop.data.update(dropData);
    spinStop();
  }


  log('Updated  : ', `https://app.ctx.xyz/d/${domainName}/nft => ${res.success ? 'success': 'fail'}`);
}

async function createAsset(context, confData, domainName) {
  spinStart('Uploading Cover to Context');
  await context.createAsset(`assets/cover`, `./data/assets/${confData.image}`);
  spinStop();
  log('Uploaded : ', `https://rpc.ctx.xyz/${domainName}/assets/cover`);
}

async function deploySmartContract(collectionContractFactory, domainName, confData): Promise <string> {
  spinStart('Deploying NFT Contract');
  const nftCollection = await collectionContractFactory.deploy(
    confData.name,
    confData.symbol,
    `https://rpc.ctx.xyz/${domainName}/${confData.path}`
  );
  await nftCollection.waitForDeployment();
  spinStop();
  log('Deployed : ', nftCollection.target);
  return nftCollection.target;
}

function logCollection(collectionDocument) {
  log('Document : ', collectionDocument.path);
  log('Version  : ', collectionDocument.versionNumber);
  log('ChainId  : ', collectionDocument.data.chainId);
  log('Address  : ', collectionDocument.data.address);
  // process.exit();
}

async function createLevels(context, confData, domainName) {
  const maxlevel = 1;
  for (let i = 3; i < 6; i++) {
    const level = i;
    const levelPath = `assets/level${level}`;
    const asset = await context.document(`${domainName}/${levelPath}`);
    if (asset.success === false) {
      spinStart(`Uploading Level ${level} to Context`);
      await context.createAsset(levelPath, `./data/assets/level${level}.png`);
      spinStop();
      console.log(levelPath, `./data/assets/level${level}.png`);
      log('Uploaded : ', `https://rpc.ctx.xyz/${domainName}/${levelPath}`);
    }
  }
  
  
}
main();