import { isFollower } from "../server/actions/follower";
import { title } from "./utils/console";
import dotenv from "dotenv";
dotenv.config();

/**
 * MAIN
 */
async function main() {
  
  title(`Is Follower`);

  console.log('isFollower @cryptobenkei: ' + await isFollower( 8691, 8691));
  console.log('isFollower @jesus: ' + await isFollower( 8691, 4549));
  console.log('isFollower @other: ' + await isFollower( 8691, 60));
  
}


main();