import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export async function isFollower(fid, fidFollower) {
    if (fid === fidFollower) return true;
    const client = new NeynarAPIClient(process.env.NEYNAR_API as string);
    let found: boolean = false;
    let options: any = {};
    do {
        const response = await client.fetchUserFollowers(fid, options);
        
        const users = response.result.users;
        const user = users.find((follow) => follow.fid === fidFollower);
        if (user) found = true;
        // if (response.result.users[0] === fid) found = true;
        options = { cursor: response.result.next.cursor };
    } while (found === false && options.cursor !== null)
    return found;

}