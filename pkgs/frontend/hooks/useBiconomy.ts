import {
  type NexusClient,
  createBicoPaymasterClient,
  createSmartAccountClient,
  toNexusAccount,
} from "@biconomy/abstractjs";
import { useSign7702Authorization, useWallets } from "@privy-io/react-auth";
import { ZKNFT_ABI } from "lib/abi";
import { ZKNFT_CONTRACT_ADDRESS } from "lib/utils";
import { useCallback, useState } from "react";
import {
  type Abi,
  createWalletClient,
  custom,
  encodeFunctionData,
  http,
} from "viem";
import { baseSepolia } from "viem/chains";

// ゼロ知識証明のデータ構造を定義する型
interface ZKProof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
}

// Biconomyアカウントの状態を管理する型
interface BiconomyAccountState {
  nexusAccount: NexusClient | null;
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

      const provider = await embeddedWallet.getEthereumProvider();
      // Create a signer Object for the embedded wallet
      const walletClient = createWalletClient({
        account: embeddedWallet.address as `0x${string}`,
        chain: baseSepolia,
        transport: custom(provider),
      });

      // Create Smart Account Client
      const nexusClient = createSmartAccountClient({
        account: await toNexusAccount({
          signer: walletClient,
          chain: baseSepolia,
          transport: http(),
        }),
        transport: http(
          `https://bundler.biconomy.io/api/v3/${baseSepolia.id}/${process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_API_KEY}`,
        ),
        paymaster: createBicoPaymasterClient({
          paymasterUrl: `https://paymaster.biconomy.io/api/v2/${baseSepolia.id}/${process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY}`,
        }),
      });
      // get the smart account address
      const address = await nexusClient.account.address;

      console.log("Nexus Account:", address);
      console.log("done initializing Biconomy account");

      setAccountState({
        nexusAccount: nexusClient,
        address: embeddedWallet.address,
        isLoading: false,
        error: null,
      });

      return address;
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
  }, [embeddedWallet]);

  /**
   * NFTをミントするためのメソッド
   *
   * @param proof ゼロ知識証明のデータ(配列)
   * @param publicSignals パブリックシグナルのデータ(配列)
   * @returns トランザクションハッシュ値
   */
  const mintNFT = useCallback(
    async (proof: ZKProof, publicSignals: string[]): Promise<string | null> => {
      if (!accountState.nexusAccount) return Promise.resolve(null);

      console.log("Minting NFT with proof:", proof);

      // 実行したいトランザクションデータのfunction call dataを作成
      const functionCallData = encodeFunctionData({
        abi: ZKNFT_ABI as Abi,
        functionName: "safeMint",
        args: [
          embeddedWallet.address,
          proof.a,
          proof.b,
          proof.c,
          publicSignals,
        ],
      });

      console.log("Function call data:", functionCallData);

      // トランザクションを送信
      const hash = await accountState.nexusAccount.sendTransaction({
        to: ZKNFT_CONTRACT_ADDRESS,
        data: functionCallData,
        chain: baseSepolia,
      });

      console.log("Submitted tx hash:", hash);

      const receipt = await accountState.nexusAccount.waitForTransactionReceipt(
        { hash },
      );
      console.log("Transaction receipt: ", receipt);

      return hash;
    },
    [accountState.nexusAccount, embeddedWallet?.address],
  );

  return {
    // アカウント状態
    smartAccount: accountState.nexusAccount,
    address: accountState.address,
    isLoading: accountState.isLoading,
    error: accountState.error,

    // メソッド
    initializeBiconomyAccount,
    mintNFT,
  };
};
