import { ethers, id } from "ethers";
import { getContext, getBlockchain, loadData, loadConf } from "./utils";
import { log, title, spinStart, spinStop } from "./utils/console";
import fs from "fs";

async function main() {
    // Load Configuration from /data/conf.json
    const confData = await loadConf();

    // Get information from context and load documents.
    const { address, context } = await getContext(true);

    // Get information from Blockchain.
    const { provider } = await getBlockchain(context, confData.chainId, address);

    // Listen NFTCOllection to tevents.
    const filter = {
        address: address,
        topics: [id("Minted(uint256,uint256)")]
    }
    
    provider.on(filter, (log, event) => {
        console.log(log);
        console.log(event);
    })
}

main();