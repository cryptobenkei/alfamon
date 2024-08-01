import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from "dotenv";
dotenv.config();

let db: Db;

let logsCollection: Collection;
let nftCollection: Collection;
let userCollection: Collection;
let missionsCollection: Collection;
let userMissionCollection: Collection;

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
        missionsCollection  = db.collection('missions');
        userCollection  = db.collection('users');
        userMissionCollection = db.collection('users_missions');
        console.log('Connected to MongoDB');
        resolve ( { nftCollection, logsCollection, missionsCollection, userCollection, userMissionCollection });
    }).catch((err: any) => console.error(err));
    });
}
export async function getMissionsByFid(fid) {
    const nfts = await nftCollection.find({requesterId: fid});
    return await nfts.toArray();
}

export async function updateLogs(db: any, id: string, action: string = '') {
    // If topic does not exists, create a new one and store the latest version
    const currentDate = new Date();
    const log = await db.logsCollection.insertOne({
        id,
        action,
        date: currentDate
    })
}

export async function insertTx(db: any, transactionId: string, dropId: string, casterId, requesterId) {
  // If topic does not exists, create a new one and store the latest version
  const currentDate = new Date();
  const currentTimestamp = Math.floor(Date.now() / 1000);
  let tx = await db.nftCollection.findOne({transactionId});
  if (!tx) {
    tx = await db.nftCollection.insertOne({
      transactionId,
      dropId,
      casterId,
      requesterId,
      date: currentDate,
      level:0,
      leveledUp: currentTimestamp
    })
  } else {
    await db.nftCollection.updateOne(
        { transactionId },
        { $set: { dropId, minted: currentDate, casterId, requesterId } }
    );
  }
  let user = await db.userCollection.findOne({fid: requesterId });
  if (!user) {
    user = await db.nftCollection.insertOne({
      fid: requesterId,
      date: currentDate,
      level:0,
      leveledUp: currentTimestamp
    })
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
            leveledUp: currentDate,
            casterId: 0,
            requeterId: 0
        })
    } else {
        tx = await db.nftCollection.updateOne(
            { transactionId },
            { $set: {
                tokenId,
                minted: currentDate,
                owner
            } }
        );
    }
}