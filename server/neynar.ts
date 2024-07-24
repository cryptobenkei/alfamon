import dotenv from "dotenv";
dotenv.config();

export async function getUser(fid) {
    return new Promise((resolve) => {
        const url = 'https://api.neynar.com/v2/farcaster/user/bulk?fids='+fid;
        const options:any = {
        method: 'GET',
            headers: {accept: 'application/json', api_key: process.env.NEYNAR_API}
        };

        fetch(url, options)
            .then(res => res.json())
            .then(json => resolve(json.users[0]))
            .catch(err => console.error('error:' + err));
    });
}

export async function cast(fid, tokenId) {
  console.log(process.env.NEYNAR_API);
  console.log(process.env.NEYNAR_FID);
  console.log(process.env.NEYNAR_SIGNER);
    const user: any = await getUser(fid);
    const shareUrl = "https://frame.ctx.xyz/alfamon?tokenId=" + tokenId;
    const text: string = `Congrats @${user.username}, you now own an exclusive Alfamon 🪐. Remember to take care of it to hatch the egg : ${shareUrl}`
    const url = 'https://api.neynar.com/v2/farcaster/cast';
    const options: any = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        api_key: process.env.NEYNAR_API,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        parent_author_fid: process.env.NEYNAR_FID,
        signer_uuid: process.env.NEYNAR_SIGNER,
        text
      })
    };
    
    fetch(url, options)
      .then(res => res.json())
      .then(json => console.log(json))
      .catch(err => console.error('error:' + err));
}
