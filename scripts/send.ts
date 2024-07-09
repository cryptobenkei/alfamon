import { parseEther } from "ethers";
import { loadConf, getContext, getBlockchain} from "./utils";
import { title, spinStart, spinStop, log } from "./utils/console";

/**
 * MAIN
 */
async function main() {
    
  // Load Configuration from /data/conf.json
  const confData = await loadConf();

  // Get information from context and load documents.
  const { address, context } = await getContext();

  // Get information from Blockchain.
  const { wallet } = await getBlockchain(context, confData.chainId, address);
  await sendEther(wallet);

  title(`Send tokens`);
}

async function sendEther(wallet:any) {
  try {
      const amountInEther = "0.003";
      const tx = {
          to: "0x99ccD518Fb9624e22569613487b1736d886b610F",
          value: parseEther(amountInEther),
      };

      const transactionResponse = await wallet.sendTransaction(tx);
      console.log('Transaction hash:', transactionResponse.hash);

      // Wait for the transaction to be mined
      await transactionResponse.wait();
      console.log('Transaction mined!');
  } catch (error) {
      console.error('Error sending Ether:', error);
  }
}


main();