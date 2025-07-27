import {
  type Instruction,
  type MeeClient,
  type MultichainSmartAccount,
  createMeeClient,
  toMultichainNexusAccount,
} from "@biconomy/abstractjs";
import { useSign7702Authorization, useWallets } from "@privy-io/react-auth";
import { ZKNFT_ABI } from "lib/abi";
import {
  NEXUS_IMPLEMENTATION,
  USDC_ADDRESS,
  ZKNFT_CONTRACT_ADDRESS,
} from "lib/utils";
import { useCallback, useState } from "react";
import { type Abi, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";

// ゼロ知識証明のデータ構造を定義する型
interface ZKProof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
}

// Biconomyアカウントの状態を管理する型
interface BiconomyAccountState {
  smartAccount: MeeClient | null;
  nexusAccount: MultichainSmartAccount | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Biconomyのスマートアカウント機能を管理するカスタムフック
 *
 * @returns Biconomyアカウントの状態と操作メソッド
 */
export const useBiconomy = () => {
  const { wallets } = useWallets();
  const { signAuthorization } = useSign7702Authorization();

  // エンベデッドウォレットの取得（エラーハンドリング改善）
  const embeddedWallet = wallets?.[0];

  // Biconomyアカウントの状態を管理する
  const [accountState, setAccountState] = useState<BiconomyAccountState>({
    smartAccount: null,
    nexusAccount: null,
    address: null,
    isLoading: false,
    error: null,
  });

  /**
   * Biconomyスマートアカウントを初期化する
   *
   * @returns 初期化されたスマートアカウントのアドレス
   */
  const initializeBiconomyAccount = useCallback(async (): Promise<
    string | null
  > => {
    try {
      setAccountState((prev) => ({ ...prev, isLoading: true, error: null }));
      // base Sepoliaチェーンに切り替え
      await embeddedWallet.switchChain(baseSepolia.id);
      const provider = await embeddedWallet.getEthereumProvider();
      // WalletClientを作成
      const walletClient = createWalletClient({
        account: embeddedWallet.address as `0x${string}`,
        chain: baseSepolia,
        transport: custom(provider),
      });

      // Nexusアカウントを作成
      const nexusAccount = await toMultichainNexusAccount({
        chains: [baseSepolia],
        transports: [http()],
        signer: walletClient,
        accountAddress: embeddedWallet.address as `0x${string}`,
      });

      console.log("Nexus Account:", nexusAccount.signer.address);

      const authorization = await signAuthorization({
        contractAddress: NEXUS_IMPLEMENTATION,
        chainId: 0,
      });

      console.log("Authorization:", authorization);

      // Create Mee Client
      const meeClient = await createMeeClient({
        account: nexusAccount,
        apiKey: process.env.NEXT_PUBLIC_MEE_API_KEY,
      });

      console.log("Biconomy Mee Client:", meeClient.account);
      console.log("done initializing Biconomy account");

      setAccountState({
        smartAccount: meeClient,
        nexusAccount: nexusAccount,
        address: embeddedWallet.address,
        isLoading: false,
        error: null,
      });

      return meeClient.account.signer.address;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setAccountState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [embeddedWallet, signAuthorization]);

  /**
   * NFTをミントするためのメソッド
   *
   * @param proof ゼロ知識証明のデータ(配列)
   * @param publicSignals パブリックシグナルのデータ(配列)
   * @returns トランザクションハッシュ値
   */
  const mintNFT = useCallback(
    async (proof: ZKProof, publicSignals: string[]): Promise<string | null> => {
      if (!accountState.smartAccount) return Promise.resolve(null);

      console.log("Minting NFT with proof:", proof);

      // 実行したいトランザクションデータの構築
      const runtimeInstruction =
        await accountState.nexusAccount?.buildComposable({
          type: "default",
          data: {
            abi: ZKNFT_ABI as Abi,
            functionName: "safeMint",
            chainId: baseSepolia.id,
            to: ZKNFT_CONTRACT_ADDRESS,
            args: [
              embeddedWallet.address,
              proof.a,
              proof.b,
              proof.c,
              publicSignals,
            ],
          },
        });

      const authorization = await signAuthorization({
        contractAddress: NEXUS_IMPLEMENTATION,
        chainId: 0,
      });

      console.log("Authorization:", authorization);

      // スマートアカウントを使用してトランザクションを実行
      const { hash } = await accountState.smartAccount.execute({
        authorization,
        delegate: true,
        // Gas paid with USDC on Base Sepolia
        feeToken: {
          address: USDC_ADDRESS,
          chainId: baseSepolia.id,
        },

        instructions: [runtimeInstruction as Instruction[]],
      });

      console.log("Submitted tx hash:", hash);

      return hash;
    },
    [
      accountState.smartAccount,
      accountState.nexusAccount,
      embeddedWallet?.address,
      signAuthorization,
    ],
  );

  return {
    // アカウント状態
    smartAccount: accountState.smartAccount,
    address: accountState.address,
    isLoading: accountState.isLoading,
    error: accountState.error,

    // メソッド
    initializeBiconomyAccount,
    mintNFT,
  };
};
