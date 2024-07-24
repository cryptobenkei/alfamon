import { getContext } from "../scripts/utils";
import { isFollower } from "./actions/follower";


function getLastNumber(str: string): number | null {
    // Use a regular expression to match the last number in the string
    const match = str.match(/(\d+)(?!.*\d)/);
    
    // If a match is found, convert it to a number and return it
    if (match) {
        return parseInt(match[0], 10);
    }
    
    // If no number is found, return null
    return null;
}

const hoursAndMinutes = (timeInSec) => {
    const date = new Date(timeInSec);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const minute = (minutes > 1) ? `${minutes} minutes`: `${minutes} minute`
    if (hours > 0) {
        const hour = (hours > 1) ? `${hours} hours` : `${hours} hour`;
        return `${hour} and ${minute}`;
    } else {
        return `${minute}`;
    }
  };

export const updateMetadata = async(data) => {
    const { context, domainName } = await getContext(true);
    const result = await context.document(`${data.tokenId}`);
    if (result.success && result.data) {
      try {
        const nft = result.data;
        
        const newData: any = {...nft.data};
        newData.level = data.newLevel;
        newData.image = `https://rpc.ctx.xyz/${domainName}/assets/level${data.newLevel}`;
        newData.nextLevelUp = data.nextLevelUp;
        console.log('*** Update NFT!', newData);
        await nft.update(newData);
        return true;
      } catch (e) {
        console.log("Error", e);
        return false;
      }
    } else return false;
  }

export async function levelUp(db: any, nftQueue, tokenId: string, inputText: string): Promise<string>  {
    const token = getLastNumber(tokenId);
    const nft = await db.nftCollection.findOne({ tokenId: token });
    if (!nft) {
      return `NFT with tokenId ${token} not found`;
    }
    const { context, domainName } = await getContext(true);
    let result = await context.document(`${tokenId}`);
    if (!result.success || !result.data) {
        return `NFT with tokenId ${tokenId} not found`;
    }
    const nftDoc:any = result.data.data;
    const level = nft.level ? nft.level : 0;
    const newLevel = level + 1;

    result = await context.document(`${domainName}/nft`);
    if (!result.success || !result.data) {
        return `NFT with domain ${domainName}/nft not found`;
    }
    const projectDoc:any = result.data.data;
    if (!projectDoc.actions[level]) {
        return `Nothing to do at level ${level}... Check again later`;
    }

    // Verify Cooldown (ts in seconds).
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const tsLevelUp = nft.nextLevelUp ? nft.nextLevelUp : 0;
    if (tsLevelUp > 0 && tsLevelUp > currentTimestamp) {
        const remainingCooldown = tsLevelUp - currentTimestamp;
        const timeRemaining = hoursAndMinutes(remainingCooldown);
        return `Cooldown active. Please wait ${timeRemaining} seconds before leveling up again.`;
    }

    // Verify Action
    let levelUp: boolean = false;
    switch (projectDoc.actions[level].type) {
        case 'button':
            levelUp = true;
        break;
        case 'secret':
            console.log("secret: " + inputText);
            if (inputText === 'alfamon') {
                levelUp = true;
            } else {
                return 'Invalid Secret';
            }
            // Verify Secret
        break;
        case 'follow':
            const followFid = projectDoc.actions[level].fid;
            const found = await isFollower(followFid, nft.requesterId);
            if (found) levelUp = true;
            else return "Need to follow first";
        break;
    }
    if (levelUp) {
        const cooldown = projectDoc.actions[level].cooldown || 0;
        const nextLevelUp = currentTimestamp + cooldown
        await db.nftCollection.updateOne(
            { tokenId: token },
            {
                $set: { level: newLevel, nextLevelUp: nextLevelUp }
            }
        );
        await nftQueue.add('levelUp', { tokenId, newLevel, nextLevelUp });
        return `Your Alfamon is now at Level ${newLevel}`
    } else {
        return 'Level Up Failed'   
    }
}
