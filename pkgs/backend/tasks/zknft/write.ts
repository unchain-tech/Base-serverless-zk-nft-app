import * as fs from "node:fs";
import * as path from "node:path";
import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { readContract, writeContract } from "viem/actions";
import { baseSepolia } from "viem/chains";
import { getContractAddress } from "../../helpers/contractJsonHelper";

// Define custom chain config to avoid conflicts
const customBaseSepolia = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.base.org"] },
  },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://sepolia.basescan.org" },
  },
  testnet: true,
};

/**
 * 【Task】mint ZKNFT with zero-knowledge proof using calldata.json
 */
task("mintZKNFT", "mint ZKNFT with zero-knowledge proof using calldata.json")
  .addParam("to", "The address to mint the NFT to")
  .addOptionalParam(
    "calldataPath",
    "Path to calldata.json file",
    "../circuit/data/calldata.json",
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const { to, calldataPath } = taskArgs;

    // get wallet client
    const [owner] = await hre.viem.getWalletClients({
      chain: baseSepolia,
    });
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
              Minting to: ${to}
          `);

    try {
      // Read calldata from JSON file
      const calldataFilePath = path.resolve(__dirname, calldataPath);
      console.log(`Reading calldata from: ${calldataFilePath}`);

      if (!fs.existsSync(calldataFilePath)) {
        throw new Error(`Calldata file not found: ${calldataFilePath}`);
      }

      const calldataJson = fs.readFileSync(calldataFilePath, "utf8");
      const calldata = JSON.parse(calldataJson);

      // Extract proof components from calldata
      // Format: [pA, pB, pC, publicSignals]
      const [pAHex, pBHex, pCHex, publicSignalsHex] = calldata;

      // Convert hex strings to BigInt
      const pA = pAHex.map((x: string) => BigInt(x));
      const pB = pBHex.map((row: string[]) => row.map((x: string) => BigInt(x)));
      const pC = pCHex.map((x: string) => BigInt(x));
      const publicSignals = publicSignalsHex.map((x: string) => BigInt(x));

      console.log(`
              Loaded proof data:
              pA: [${pA.join(", ")}]
              pB: [[${pB[0].join(", ")}], [${pB[1].join(", ")}]]
              pC: [${pC.join(", ")}]
              publicSignals: [${publicSignals.join(", ")}]
          `);

      // Check current total supply before minting
      const artifacts = await hre.artifacts.readArtifact("ZKNFT");
      const currentSupply = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "totalSupply",
        args: [],
      });

      console.log(`Current total supply: ${currentSupply}`);

      // Execute safeMint transaction using writeContract directly
      const hash = await writeContract(owner, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "safeMint",
        args: [
          to as `0x${string}`,
          pA as [bigint, bigint],
          pB as [[bigint, bigint], [bigint, bigint]],
          pC as [bigint, bigint],
          publicSignals as [bigint],
        ],
      });

    // create Contract instance
    const zknft = await hre.viem.getContractAt(
      "ZKNFT",
      contractAddress as `0x${string}`,
      {
        client: { wallet: owner },
      },
    );

    try {
      // Read calldata from JSON file
      const calldataFilePath = path.resolve(__dirname, "..", "..", "circuit", "data", "calldata.json");
      console.log(`Reading calldata from: ${calldataFilePath}`);

      if (!fs.existsSync(calldataFilePath)) {
        throw new Error(`Calldata file not found: ${calldataFilePath}`);
      }

      const calldataJson = fs.readFileSync(calldataFilePath, "utf8");
      const calldata = JSON.parse(calldataJson);

      // Extract proof components from calldata
      // Format: [pA, pB, pC, publicSignals]
      const [pAHex, pBHex, pCHex, publicSignalsHex] = calldata;

      // Convert hex strings to BigInt
      const pA = pAHex.map((x: string) => BigInt(x));
      const pB = pBHex.map((row: string[]) => row.map((x: string) => BigInt(x)));
      const pC = pCHex.map((x: string) => BigInt(x));
      const publicSignals = publicSignalsHex.map((x: string) => BigInt(x));

      console.log(`
              Loaded proof data:
              pA: [${pA.join(", ")}]
              pB: [[${pB[0].join(", ")}], [${pB[1].join(", ")}]]
              pC: [${pC.join(", ")}]
              publicSignals: [${publicSignals.join(", ")}]
          `);

      // Check current total supply before minting
      const artifacts = await hre.artifacts.readArtifact("ZKNFT");
      const currentSupply = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "totalSupply",
        args: [],
      });

      console.log(`Current total supply: ${currentSupply}`);

      // Execute safeMint transaction using writeContract directly
      const hash = await writeContract(owner, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "safeMint",
        args: [
          to as `0x${string}`,
          pA as [bigint, bigint],
          pB as [[bigint, bigint], [bigint, bigint]],
          pC as [bigint, bigint],
          publicSignals as [bigint],
        ],
      });

      console.log(`Transaction hash: ${hash}`);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);

      // Check new total supply after minting
      const newSupply = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "totalSupply",
        args: [],
      });

      console.log(`New total supply: ${newSupply}`);
    } catch (error) {
      console.error("Error minting ZKNFT:", error);
    }

    console.log(
      "################################### [END] ###################################",
    );
  });

/**
 * 【Task】get NFT owner information
 */
task("getNFTOwner", "get NFT owner information")
  .addParam("tokenid", "The token ID to check")
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

      // call ownerOf method
      const ownerOfToken = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });

      // call balanceOf method for the owner
      const balance = await readContract(publicClient, {
        address: contractAddress as `0x${string}`,
        abi: artifacts.abi,
        functionName: "balanceOf",
        args: [ownerOfToken],
      });

      console.log(`
              Token ID ${tokenId} is owned by: ${ownerOfToken}
              Owner's total balance: ${balance}
          `);
    } catch (error) {
      console.error("Error getting NFT owner information:", error);
    }

    console.log(
      "################################### [END] ###################################",
    );
  });
