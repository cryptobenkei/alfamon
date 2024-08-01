import express, { Request, Response, NextFunction } from 'express';
import { listenToBlockchainEvents } from './blockchain';
import { initMongoDB, updateLogs, insertTx, getMissionsByFid } from './mongodb';
import { levelUp, updateMetadata } from './levelup';
import { Queue, Worker } from 'bullmq';
import { createHmac } from "crypto";

import IORedis from 'ioredis';
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
};

let db;
const app = express();
const port = 3001;

// Bull Queues
const connection = new IORedis(redisOptions);
const nftQueue = new Queue('NFTs', { connection });
const worker = new Worker('NFTs', async job => {
  await updateMetadata(job.data);
}, { connection });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

app.use(express.json());

// Middleware function to verify API key
const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['api-key'];
  console.log(req.headers);
  if (apiKey !== process.env.SECRET_KEY) {
	  console.log('Invalid API KEY');
    return res.status(403).send('Forbidden: Invalid API Key');
  }
  next(); // Call next() to pass control to the next handler
};

const verifySignature = (req: Request) => {
  const sig = req.headers["x-neynar-signature"];
  if (!sig) {
    throw new Error("Neynar signature missing from request headers");
  }

  const webhookSecret = process.env.NEYNAR_WEBHOOK_SECRET || "6b3ayPY24f7R2Vk8a2A5fH6Qb";
  if (!webhookSecret) {
    throw new Error("Make sure you set NEYNAR_WEBHOOK_SECRET in your .env file");
  }

  const hmac = createHmac("sha512", webhookSecret);
  const body = JSON.stringify(req.body);
  hmac.update(body);
  const generatedSignature = hmac.digest("hex");
  const isValid = generatedSignature === sig;
  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }
  
  const hookData = JSON.parse(body);
  return hookData;
}

app.get('/check', async (req: Request, res: Response) => {
  console.log("CHECK **");
  res.send('Checked');
});

app.post('/reaction/:hookId', async (req: Request, res: Response) => {
  console.log("REACTION **");
  const hookId = req.params.hookId;
  console.log(`Hook ID: ${hookId}`);

  /*const body = await verifySignature(req);
  const fid = body.data.user.fid;
  const castHash = body.data.cast.hash;
  console.log(body);
  const nfts = await getMissionsByFid(fid);
  for (const nft of nfts) {
    console.log(nft);
  }*/
  res.json({ message: 'Mission success' });
});


app.post('/levelup', verifyApiKey, async (req: Request, res: Response) => {
  console.log("LEVELUP **", req.body);
  const { tokenId, inputText } = req.body;
  
  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId is required' });
  }
  const message = await levelUp(db, nftQueue, tokenId, inputText );
  await updateLogs(db, tokenId, 'levelUp');
  res.json({ message });
});

app.post('/mint', verifyApiKey, async (req: Request, res: Response) => {
  console.log("MINT **", req.body);
  await updateLogs(db, req.body.id, 'mint');
  res.json({ message: 'Log accepted' });
});

app.post('/mint-success', verifyApiKey, async (req: Request, res: Response) => {
  console.log("SUCCESS **", req.body);
  await insertTx(db, req.body.transactionId, req.body.dropId, req.body.casterId, req.body.minterId );
  await updateLogs(db, req.body.id, 'mint-success');
  res.json({ message: 'Mint success' });
});

app.post('/cast', async (req: Request, res: Response) => {
  await updateLogs(db, req.body.id, 'cast');
  res.json({ message: 'Cast success' });
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  db = await initMongoDB();
  listenToBlockchainEvents(db);
});
