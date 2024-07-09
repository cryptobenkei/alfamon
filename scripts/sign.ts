import { solidityPackedKeccak256, Wallet, getBytes } from "ethers";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const privateKey: `0x${string}` = `0x${process.env.WALLET_PRIVKEY}` as `0x${string}` || '0x';
    const wallet = new Wallet(privateKey);
    const account = wallet.address;
    const messageHash = solidityPackedKeccak256(
        ['address', 'uint256', 'uint256'],
        [account, 10n, 1n]
    );
    const signature = await wallet.signMessage(getBytes(messageHash));

    console.log("addr  : " +  account);
    console.log("msg   : " + messageHash);
    console.log("\n" + account + ",10,1," + signature);
}

main();
