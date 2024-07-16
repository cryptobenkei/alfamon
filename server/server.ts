import express, { Request, Response, NextFunction } from 'express';
import { listenToBlockchainEvents } from './blockchain';
import { initMongoDB, updateLogs, insertTx, incubate } from './mongodb';
let db;
const app = express();
const port = 3001;

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

app.post('/incubate', verifyApiKey, async (req: Request, res: Response) => {
  console.log("INCUBATE **");
  const { tokenId } = req.body;
  
  if (!tokenId) {
    return res.status(400).json({ error: 'tokenId is required' });
  }

  const result = await incubate(tokenId);
  res.json({ message: 'Great Job, your NFT just evolved to the next level!' });
});

app.post('/mint', verifyApiKey, async (req: Request, res: Response) => {
  console.log("MINT **", req.body);
  await updateLogs(db, req.body.id);
  res.json({ message: 'Log accepted' });
});

app.post('/mint-success', verifyApiKey, async (req: Request, res: Response) => {
  console.log("SUCCESS **", req.body);
  await insertTx(db, req.body.transactionId, req.body.dropId, req.body.casterId, req.body.minterId );
  res.json({ message: 'Mint success' });
});

app.post('/cast', (req: Request, res: Response) => {
  res.json({ message: 'Cast success' });
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  db = await initMongoDB();
  listenToBlockchainEvents(db);
});
