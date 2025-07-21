import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { readContract } from "viem/actions";
import { baseSepolia } from "viem/chains";
import { getContractAddress } from "../../helpers/contractJsonHelper";

/**
 * 【Task】call totalSupply method of ZKNFT contract
 */
task("callTotalSupply", "call totalSupply method of ZKNFT contract").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    // get public client
    const publicClient = await hre.viem.getPublicClient({
      chain: baseSepolia,
    });
    // get chain ID
    const chainId = (await publicClient.getChainId()).toString();
    // get contract name
    const contractName = "ZKNFTModule#ZKNFT";
    // get contract address
    const contractAddress = getContractAddress(chainId, contractName);

    console.log(`
            ${contractName} 's address is ${contractAddress}
        `);

    try {
      // Get the contract artifacts to access ABI
      const artifacts = await hre.artifacts.readArtifact("ZKNFT");

      // call contract methods using readContract (start with basic functions)
      const name = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "name",
        args: [],
      });

      const symbol = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "symbol",
        args: [],
      });

      const verifierAddress = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "verifier",
        args: [],
      });

      console.log(`
            Contract Name: ${name}
            Contract Symbol: ${symbol}
            Verifier Address: ${verifierAddress}
        `);

      // Try totalSupply (might not be available on deployed contract)
      try {
        const totalSupply = await readContract(publicClient, {
          address: contractAddress as `0x${string}`,
          abi: artifacts.abi,
          functionName: "totalSupply",
          args: [],
        });
        console.log(`            Total Supply: ${totalSupply}`);
      } catch (totalSupplyError) {
        console.log(
          "            Total Supply: Function not available on deployed contract",
        );
      }
    } catch (error) {
      console.error("Error calling contract methods:", error);
    }

    console.log(
      "################################### [END] ###################################",
    );
  },
);

/**
 * 【Task】call tokenURI method of ZKNFT contract
 */
task("callTokenURI", "call tokenURI method of ZKNFT contract")
  .addParam("tokenid", "The token ID to get URI for")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const tokenId = taskArgs.tokenid;

    // get public client
    const publicClient = await hre.viem.getPublicClient({
      chain: baseSepolia,
    });
    // get chain ID
    const chainId = (await publicClient.getChainId()).toString();
    // get contract name
    const contractName = "ZKNFTModule#ZKNFT";
    // get contract address
    const contractAddress = getContractAddress(chainId, contractName);

    console.log(`
              ${contractName} 's address is ${contractAddress}
              Token ID: ${tokenId}
          `);

    try {
      // Get the contract artifacts to access ABI
      const artifacts = await hre.artifacts.readArtifact("ZKNFT");

      // call tokenURI method
      const tokenURI = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      });

      const ownerOfToken = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });

      console.log(`
              Token URI: ${tokenURI}
              Owner of Token: ${ownerOfToken}
          `);

      // Decode base64 encoded JSON metadata if it's a data URI
      if (
        typeof tokenURI === "string" &&
        tokenURI.startsWith("data:application/json;base64,")
      ) {
        const base64Data = tokenURI.split(",")[1];
        const decodedMetadata = Buffer.from(base64Data, "base64").toString(
          "utf-8",
        );
        console.log(`
              Decoded Metadata:
              ${JSON.stringify(JSON.parse(decodedMetadata), null, 2)}
          `);
      }
    } catch (error) {
      console.error("Error calling contract methods:", error);
    }

    console.log(
      "################################### [END] ###################################",
    );
  });
