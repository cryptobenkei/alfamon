import { parseEther } from "ethers";
import { loadConf, getContext, getBlockchain, getDrop } from "./utils";
import { error, title, spinStart, spinStop, log } from "./utils/console";
import fs from "fs";

async function main(dropName: string, action = "open") {
  
  // Load Configuration from /data/conf.json
  const confData = await loadConf();

  // Get information from context and load documents (verify).
  const { address, context, domainName  } = await getContext(true);

  // Get drop Configuration + verify.
  const { drop } = await getDrop(context, domainName, confData, dropName, false);

  // get Blockchain (and verify)
  const { collectionContract, flexmarketContract, wallet } = await getBlockchain(context, confData.chainId, address, true);

  title(`Drop ${domainName} : ${dropName}`);
  const resultDocument = await context.document(`${domainName}/drops/${dropName}`);
  if (resultDocument.success) {
    // Drop already exists.
    const dropDocument = resultDocument.data;
    const drop = {...dropDocument.data};
    logDrop(drop);    

    if (action === "close") {
      // Close the Drop.
      await closeDrop(flexmarketContract, drop, dropDocument);

    } else if (action === "mint") { 
      // Mint an NFT in the Drop.
      console.log(BigInt(drop.dropId), wallet.address, {value: parseEther(drop.price)})
      let tx = await flexmarketContract.mint(BigInt(drop.dropId), wallet.address, {value: parseEther(drop.price)});
      await tx.wait();
    }
  }
  else {
    // Step One : Set the cflexmarket contract as minter.
    await setMinter(collectionContract, flexmarketContract);

    // Step Two : Create a new drop ni the flexmarket contract.
    const { dropId, transactionHash } = await createDrop( flexmarketContract, collectionContract.target, drop, wallet.address );

    // Step Three : Upload cover of the drop.
    await uploadCover(context, drop, dropId, domainName);

    // step Four : Create the document for the drop.
    const collectionId = `ctx:${domainName}/${confData.path}`;
    await createDropDocument(context, drop, dropName, dropId, domainName, collectionId, transactionHash)
    process.exit();
  }
}

async function closeDrop(flexmarketContract, drop, dropDocument) {
  // Close the Drop.
  drop.status = 'closed';
  drop.end = new Date().toISOString();
  spinStart('Closing Drop in the Minter');
  console.log(drop.dropId, BigInt(drop.dropId))
  let tx = await flexmarketContract.closeDrop(BigInt(drop.dropId));
  await tx.wait();
  spinStop();
  spinStart('Uodating the status of the Drop in Context');
  await dropDocument.update(drop);
  spinStop();
}

async function createDropDocument(context, drop, dropName, dropId, domainName, collectionId,  transactionHash) {
  spinStart(`Creating context document`);
  const res = await context.createDocument(
    `drops/${dropName}`,
    {
      name: drop.name,
      description: drop.description,
      collection: collectionId,
      nftName: drop.nftName,
      nftDescription: drop.nftDescription,
      minterContract: "ctx:flexmarket",
      dropId: dropId,
      totalSupply: drop.qty,
      totalMinted: 0,
      price : drop.price,
      referral: drop.refferal,
      image: `ctx:${domainName}/assets/drop${dropId}`,
      start: new Date().toISOString(),
      status: 'open',
      transactionHash
    },
    []
  );
  spinStop();
  
  const dir = './data/drops';

  if (!fs.existsSync('./data/drops')) fs.mkdirSync('./data/drops', { recursive: true });
  if (!fs.existsSync('./data/nfts')) fs.mkdirSync('./data/nfts', { recursive: true });

  fs.writeFileSync(`./data/drops/${dropId}.json`, JSON.stringify({
    dropName,
    totalSupply: drop.qty
  }));
  log('Saved  : ', `https://rpc.ctx.xyz/${domainName}/drops/${dropName}`);
}

async function uploadCover(context, drop, dropId, domainName) {
  spinStart('Uploading Drop Cover to Context');
  await context.createAsset(`assets/drop${dropId}`, `./data/assets/${drop.image}`);
  spinStop();
  log('Uploaded  : ', `https://rpc.ctx.xyz/${domainName}/assets/cover`);
}

async function setMinter(collectionContract, flexmarketContract) {
  spinStart(`Set Minter`);
    const tx = await collectionContract.setMinter(flexmarketContract.target);
    await tx.wait();
    spinStop();
    log('Minter  : ', 'SET');
}
async function logDrop(drop) {
  log('Name          :', drop.name);
  log('Description   :', drop.description);
  log('Total Supply  :', drop.totalSupply);
  log('Minted        :', drop.totalMinted);
  log('Price         :', drop.price);
  log('Status        :', drop.status);
  console.log("\n");
}

async function createDrop(flexmarketContract, target, drop, treasury): Promise<{dropId: string, transactionHash: string}> {
  return new Promise(async (resolve) => {

    flexmarketContract.on("CreateDrop", (newDropId)=> {
      resolve({dropId: newDropId.toString() , transactionHash});
    });

    let tx = await flexmarketContract.createDrop(
      target,
      drop.qty,
      parseEther(drop.price),
      0,
      treasury
    );
    const transactionHash = tx.hash;
    log('CreateDrop ', 'wait for the tx...');
    
    // console.log(receipt.events);
  })
}

if (!process.argv[2]) error("Invalid action : npm run drop <dropId>");
main(process.argv[2], process.argv[3] || "open");