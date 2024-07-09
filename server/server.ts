import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { listenToBlockchainEvents } from './blockchain';
import { initMongoDB, updateLogs, insertTx } from './mongodb';
let db;
const app = express();
const port = 3000;

app.use(express.json());

app.post('/mint', async (req: Request, res: Response) => {
  console.log("MINT **", req.body);
  await updateLogs(db, req.body.id);
  res.send('Log saved');
});

app.post('/mint-success', async (req: Request, res: Response) => {
  console.log("SUCCESS **", req.body);
  await insertTx(db, req.body.transactionId, req.body.dropId, req.body.casterId, req.body.minterId );
  res.send('Mint saved');
});

app.post('/cast', (req: Request, res: Response) => {
  const thread = spawn('node', ['./dist/cast.js'], { detached: true });
  thread.unref();
  res.send('Cast thread started');
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  db = await initMongoDB();
  listenToBlockchainEvents(db);
});
