import express, { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import { listenToBlockchainEvents } from './blockchain';
import { initMongoDB, updateLogs, insertTx } from './mongodb';
let db;
const app = express();
const port = 3001;

app.use(express.json());


// Middleware function to verify API key
const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['api-key'];
  console.log(req.headers);
  console.log(req.headers['api-key']);
  console.log(process.env.SECRET_KEY);
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

app.post('/mint', verifyApiKey, async (req: Request, res: Response) => {
  console.log("MINT **", req.body);
  await updateLogs(db, req.body.id);
  res.send('Log saved');
});

app.post('/mint-success', verifyApiKey, async (req: Request, res: Response) => {
  console.log("SUCCESS **", req.body);
  await insertTx(db, req.body.transactionId, req.body.dropId, req.body.casterId, req.body.minterId );
  res.send('Mint saved');
});

app.post('/cast', (req: Request, res: Response) => {

  res.send('Cast thread started');
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  db = await initMongoDB();
  listenToBlockchainEvents(db);
});
