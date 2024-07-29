import express, { Request, Response, NextFunction } from 'express';
import { listenToBlockchainEvents } from './blockchain';
import { initMongoDB, updateLogs, insertTx } from './mongodb';
import { levelUp, updateMetadata } from './levelup';
import { Queue, Worker } from 'bullmq';
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
  // Will print { foo: 'bar'} for the first job
  // and { qux: 'baz' } for the second.
  await updateMetadata(job.data);
  console.log(job.data);
}, { connection });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

app.use(express.json());

// Middleware function to verify API key
const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['api-key'];
  if (apiKey !== process.env.SECRET_KEY) {
	  console.log('Invalid API KEY');
    return res.status(403).send('Forbidden: Invalid API Key');
  }
  next(); // Call next() to pass control to the next handler
};

app.get('/check', async (req: Request, res: Response) => {
  console.log("CHECK **");
  res.send('Checked');
});

app.post('/levelup', verifyApiKey, async (req: Request, res: Response) => {
  console.log("LEVELUP **", req.body);
  const { tokenId, textInput } = req.body;
  
  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId is required' });
  }
  const message = await levelUp(db, nftQueue, tokenId, textInput );
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
