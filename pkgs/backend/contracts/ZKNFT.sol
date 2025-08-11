// SPDX-License-Identifier: MIT
// @tittle ZKNFT

// ______  ___   _ _____ _____ 
//|__  / |/ / \ | |  ___|_   _|
//  / /| ' /|  \| | |_    | |  
// / /_| . \| |\  |  _|   | |  
//____|_|\_\_| \_|_|     |_|  
//
// from https://www.asciiart.eu/text-to-ascii-art slant

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";

import './interface/IPasswordHashVerifier.sol';

/**
 * ZK NFT スマートコントラクト
 * 事前に指定された文字列から生成されたハッシュ値を渡さない限りミントできないNFTコントラクト
 */
contract ZKNFT is ERC721 {

  constructor(
    IPasswordHashVerifier _verifier
  )
    ERC721("ZKNFT", "ZNFT")
  {
    verifier = _verifier;
  }

  /**************
   * Immutables *
   **************/
  IPasswordHashVerifier public immutable verifier;

  /*************
   * Constants *
   *************/
  string public constant nftName = "ZK NFT";
  string public constant description = "This is a Serverless ZK NFT.";
  string public constant nftImage = "https://bafkreidths6s4zg2exc5wlngmhlm5bav2xsfups7zeemee3rksbbpcx6zq.ipfs.w3s.link/";

  /*************
   * Variables *
   *************/

  // @dev _nextTokenId for token id
  uint256 private _nextTokenId;

  /*************************
   * Public View Functions *
   *************************/
  
  /**
   * @dev Returns the total number of tokens minted
   */
  function totalSupply() public view returns (uint256) {
    return _nextTokenId;
  }

  function tokenURI(uint256 /* _tokenId */) public pure override(ERC721) returns (string memory) {
    return
      string(
        abi.encodePacked(
          'data:application/json;base64,',
          Base64.encode(
            bytes(
              abi.encodePacked(
                '{"name":"', nftName,
                '", "description":"', description,
                '", "image":"', nftImage,
                '", "attributes": [{"trait_type": "Type",  "value": "Winner"}]}'
              )
            )
          )
        )
      );
    }

    /********************
     * Public Functions *
     ********************/
    function safeMint(
      address to, 
      uint[2] calldata _pA,
      uint[2][2] calldata _pB,
      uint[2] calldata _pC,
      uint[1] calldata _pubSignals
    )
      public
    {
      uint256 tokenId = _nextTokenId++;

      // Verify the proof
      require(
        verifier.verifyProof(
          _pA,
          _pB,
          _pC,
          _pubSignals
        ),
        "Invalid proof"
      );

      _safeMint(to, tokenId);
    }

}