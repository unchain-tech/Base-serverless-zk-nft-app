import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getContractAddress } from "../../helpers/contractJsonHelper";

/**
 * 【Task】call mint method of ZKNFT contract
 */
task("mint", "call mint method of ZKNFT contract").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    // get public client
    const publicClient = await hre.viem.getPublicClient();
    // get chain ID
    const chainId = (await publicClient.getChainId()).toString();
    // get wallet client
    const [signer] = await hre.viem.getWalletClients();
    // get contract name
    const contractName = "ZKNFTModule#ZKNFT";
    // get contract address
    const contractAddress = getContractAddress(chainId, contractName);

    // create contract instance
    const zkNFT = await hre.viem.getContractAt("ZKNFT", contractAddress, {
      client: signer,
    });

    // calldataファイルを読み込んで解析
    const calldataPath = join(__dirname, "../../../circuit/data/calldata.json");
    const calldataContent = readFileSync(calldataPath, "utf8");
    // JSONの解析（配列形式）
    const callData = JSON.parse(`[${calldataContent}]`);

    // calldataから証明パラメータを抽出
    const pA = [BigInt(callData[0][0]), BigInt(callData[0][1])];
    const pB = [
      [BigInt(callData[1][0][0]), BigInt(callData[1][0][1])],
      [BigInt(callData[1][1][0]), BigInt(callData[1][1][1])],
    ];
    const pC = [BigInt(callData[2][0]), BigInt(callData[2][1])];
    const pubSignals = [BigInt(callData[3][0])];

    // call safeMint method
    const hash = await zkNFT.write.safeMint([
      signer.account.address,
      pA,
      pB,
      pC,
      pubSignals,
    ]);

    console.log(`hash: ${hash}`);

    console.log(
      "################################### [END] ###################################",
    );
  },
);
