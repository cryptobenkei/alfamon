import { parseEther } from "@ethersproject/units";
import getContext from "./sepolia";

async function main() {

  // Mint NFTs to bid
  const price = "0.002";
  const tokenId = 0n;
  const { publicClient, client, geekART, account, abi } = await getContext();
  const { request } = await publicClient.simulateContract({
    account,
    address: geekART,
    abi,
    functionName: 'bid',
    args: [tokenId],
    value: parseEther(price).toBigInt()
  })
  await client.writeContract(request)
}

main();