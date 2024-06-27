// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title NFTCollection
 * @dev NFTCollection is a contract for managing a collection of ERC721 NFTs.
 * It inherits from the ERC721 and Ownable contracts.
 * The contract includes functionality for minting new tokens, transferring tokens, and managing token metadata.
 */
contract NFTCollection is ERC721, Ownable {
    // _nextTokenId holds the ID of the next token to be minted.
    uint256 private _nextTokenId;

    // defaultBaseURI is the base URI for all tokens in the collection.
    string public defaultBaseURI;
    
    // Minted is an event that is emitted when a new token is minted.
    event Minted(uint256 tokenId, uint256 dropId);

    // Minter
    address minter;

    /**
     * @dev Initializes the contract by setting the name, symbol, and default URIs of the collection.
     * Inherits from the ERC721 and Ownable contracts.
     *
     * @param _name The name of the collection.
     * @param _symbol The symbol of the collection.
     * @param _defaultBaseURI The default base URI for tokens in the collection.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _defaultBaseURI
        )
        ERC721(_name, _symbol)
        Ownable(msg.sender)
    {
        defaultBaseURI = _defaultBaseURI;
        minter = msg.sender;
    }

    /**
     * @dev Sets the address of the contract minter.
     * Can only be called by the current owner.
     * @param _minter The address to set as the minter.
     */
    function setMinter(address _minter) onlyOwner() external {
        minter = _minter;
    }

    /**
     * @dev Returns the base URI for a given token ID.
     * This base URI is used by the ERC721 standard to construct the full URI for the token.
     * The full URI is the concatenation of the base URI and the token ID.
     * This function overrides the _baseURI function in the ERC721 standard.
     *
     * @return The base URI for tokens in this contract.
     */
    function _baseURI() internal view override returns (string memory) {
        return string(abi.encodePacked(defaultBaseURI, "/"));
    }

    /**
     * @dev Returns the URI for the contract metadata.
     * This URI is used by clients to retrieve metadata about the contract, such as the name, description, and image.
     *
     * @return The URI for the contract metadata.
     */
    function contractURI() public view  returns (string memory) {
        return defaultBaseURI;
    }

    /**
     * @dev Mints a new token and assigns it to the provided address.
     * This function can only be called by the minter of the contract.
     * Emits a {Minted} event.
     *
     * @param _to The address to assign the new token to.
     */
    function safeMint(address _to, uint256 dropId) public {
        require(msg.sender == minter || msg.sender == owner(), "Only minter or owner can call safeMint");
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(_to, tokenId);
        emit Minted(tokenId, dropId);
    }
}