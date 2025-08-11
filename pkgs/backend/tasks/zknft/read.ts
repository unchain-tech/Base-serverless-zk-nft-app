import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { getContractAddress } from "../../helpers/contractJsonHelper";

/**
 * 【Task】call totalSupply method of ZKNFT contract
 */
task("totalSupply", "call totalSupply method of ZKNFT contract").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    // get public client
    const publicClient = await hre.viem.getPublicClient();
    // get chain ID
    const chainId = (await publicClient.getChainId()).toString();
    // get contract name
    const contractName = "ZKNFTModule#ZKNFT";
    // get contract address
    const contractAddress = getContractAddress(chainId, contractName);

    // create contract instance
    const zkNFT = await hre.viem.getContractAt("ZKNFT", contractAddress);

    // call totalSupply method
    const totalSupply = await zkNFT.read.totalSupply();

    console.log(`totalSupply: ${totalSupply}`);

    console.log(
      "################################### [END] ###################################",
    );
  },
);
