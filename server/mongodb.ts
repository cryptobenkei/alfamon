import { levelUp } from './blockchain';
import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from "dotenv";
import e from 'express';
dotenv.config();

let db: Db;
let logsCollection: Collection;
let nftCollection: Collection;

export function initMongoDB() {
    return new Promise((resolve) => {
    // MongoDB setup
    console.log(process.env.MONGOURI);
    const uri = process.env.MONGOURI as string;
    const dbName = 'flexmarket_db';
    const client = new MongoClient(uri);
    client.connect().then(() => {
        db = client.db(dbName);
        nftCollection = db.collection('nfts');
        logsCollection = db.collection('logs');
        console.log('Connected to MongoDB');
        resolve ( { nftCollection, logsCollection });
    }).catch((err: any) => console.error(err));
    });
}

export async function updateLogs(db: any, id: string) {
    // If topic does not exists, create a new one and store the latest version
    const currentDate = new Date();
    const log = await db.logsCollection.insertOne({
        id,
        date: currentDate
    })
    console.log(log);
}

export async function insertTx(db: any, transactionId: string, dropId: string, casterId, requesterId) {
  // If topic does not exists, create a new one and store the latest version
  const currentDate = new Date();
  let tx = await db.nftCollection.findOne({transactionId});
  if (!tx) {
    tx = await db.nftCollection.insertOne({
      transactionId,
      dropId,
      casterId,
      requesterId,
      date: currentDate
    })
  } else {
    await db.nftCollection.updateOne(
        { transactionId },
        { $set: { dropId, minted: currentDate, casterId, requesterId } }
    );
}
}

export async function updateTx(db: any, transactionId: string, tokenId: string, owner: string) {
    const currentDate = new Date();
    let tx = await db.nftCollection.findOne({transactionId})
    if (!tx) {
        tx = await db.nftCollection.insertOne({
            transactionId,
            tokenId,
            owner,
            date: currentDate,
            minted: currentDate,
            level: 0,
            leveledUp: currentDate
        })
    } else {
        tx = await db.nftCollection.updateOne(
            { transactionId },
            { $set: { tokenId, minted: currentDate } }
        );
    }
}

export async function incubate(tokenId: string): Promise<string>  {
  const nft = await nftCollection.findOne({ tokenId });
  if (!nft) {
    return `NFT with tokenId ${tokenId} not found`;
  }

  if (nft.level >= 10) {
    return `NFT with tokenId ${tokenId} is already at max level`;
  }

  const currentDate = new Date();
  const lastLevelUpDate = nft.leveledUp ? new Date(nft.leveledUp) : new Date(0);

  if (currentDate.toDateString() === lastLevelUpDate.toDateString()) {
    // console.log(`NFT with tokenId ${tokenId} has already been leveled up today`);
    return `NFT with tokenId ${tokenId} has already been leveled up today`;
  }

  const updated = await levelUp(tokenId);
  if (updated) {
    const result = await nftCollection.updateOne(
        { tokenId },
        { 
        $inc: { level: 1 },
        $set: { leveledUp: currentDate }
        }
    );

    if (result.modifiedCount === 1) {
        console.log();
        return `NFT with tokenId ${tokenId} successfully incubated to level ${nft.level + 1}`
    } else {
        return `Failed to incubate NFT with tokenId ${tokenId} - update DB`;
    }
  } else {
      return `Failed to incubate NFT with tokenId ${tokenId} - update Context`;
  }
}