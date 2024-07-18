import { cast } from "../server/neynar";
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function isFollower(client, fid, fidFollower) {
    let found;
    let options: any = {};
    do {
        const response = await client.fetchUserFollowers(fid, options);
        const users = response.result.users;
        found = users.find((follow) => follow.fid === fidFollower);
        if (response.result.users[0] === fid) found = true;
        options = { cursor: response.result.next.cursor };
    } while (found === false && options.cursor !== null)
    return found;

}

async function main() {
    // await cast(791055, "https://alfamon.xyz");
    const client = new NeynarAPIClient(process.env.NEYNAR_API as string);
    const found = await isFollower(client, 791055, 8691);
    console.log(found);

    // response  = await client.lookupUserByCustodyAddress("0xd38F5B23F7adbed7eC2dA8Fb931C5A11675bE844");
    // console.log(response);
}

main();
