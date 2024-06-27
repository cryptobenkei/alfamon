import { ethers } from "hardhat";
import { expect } from "chai";

describe("NFTCollection", function () {
    it("Deploy", async function () {
      const [owner, other] = await ethers.getSigners();
      const nftCollection = await ethers.deployContract("NFTCollection", [
        "GeekART",
        "GART",
        "https://rpc.ctx.xyz/geekart/nft"
      ]);
      expect(await nftCollection.owner()).to.equal(owner.address);

      await nftCollection.safeMint(owner.address, 0n);
      await nftCollection.safeMint(owner.address, 0n);

      let nftOwner = await nftCollection.ownerOf(0n);
      expect(nftOwner).to.equal(owner.address);
      nftOwner = await nftCollection.ownerOf(1n);
      expect(nftOwner).to.equal(owner.address);

      let uri = await nftCollection.tokenURI(0n);
      expect(uri).to.equal('https://rpc.ctx.xyz/geekart/nft/0');
      uri = await nftCollection.tokenURI(1n);

      expect(uri).to.equal('https://rpc.ctx.xyz/geekart/nft/1');
      try {
        await nftCollection.connect(other).safeMint(other.address, 0n);
        expect.fail("Transfer should have reverted");
      } catch (error: any) {
        expect(error.message).to.contain("revert");
        expect(error.message).to.contain("Only minter or owner can call safeMint");
      }

      await nftCollection.connect(owner).setMinter(other.address);
      await nftCollection.connect(other).safeMint(other.address, 0n);
      nftOwner = await nftCollection.ownerOf(2n);
      expect(nftOwner).to.equal(other.address);

      await nftCollection.connect(owner).setMinter(owner.address);
      try {
        await nftCollection.connect(other).safeMint(other.address, 0n);
        expect.fail("Transfer should have reverted");
      } catch (error: any) {
        expect(error.message).to.contain("revert");
        expect(error.message).to.contain("Only minter or owner can call safeMint");
      }

      
    });
});
