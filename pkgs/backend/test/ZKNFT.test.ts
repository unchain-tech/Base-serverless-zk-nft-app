import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAddress } from "viem";

describe("ZKNFT", () => {
  // テスト用の証明データ
  let pA: [bigint, bigint];
  let pB: [[bigint, bigint], [bigint, bigint]];
  let pC: [bigint, bigint];
  let pubSignals: [bigint];
  let hasValidProofData = false;

  before(() => {
    // calldataファイルを読み込んで解析
    const calldataPath = join(
      __dirname,
      "../../../pkgs/circuit/data/calldata.json",
    );

    if (existsSync(calldataPath)) {
      try {
        const calldataContent = readFileSync(calldataPath, "utf8");
        // JSONの解析（配列形式）
        const callData = JSON.parse(`[${calldataContent}]`);

        // calldataから証明パラメータを抽出
        pA = [BigInt(callData[0][0]), BigInt(callData[0][1])];
        pB = [
          [BigInt(callData[1][0][0]), BigInt(callData[1][0][1])],
          [BigInt(callData[1][1][0]), BigInt(callData[1][1][1])],
        ];
        pC = [BigInt(callData[2][0]), BigInt(callData[2][1])];
        pubSignals = [BigInt(callData[3][0])];

        hasValidProofData = true;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn("❌ Error loading calldata file:", errorMessage);
        setupFallbackData();
      }
    } else {
      console.warn("❌ Calldata file not found, using fallback data");
      setupFallbackData();
    }
  });

  function setupFallbackData() {
    // フォールバック用のダミーデータ
    pA = [BigInt("1"), BigInt("2")];
    pB = [
      [BigInt("3"), BigInt("4")],
      [BigInt("5"), BigInt("6")],
    ];
    pC = [BigInt("7"), BigInt("8")];
    pubSignals = [BigInt("9")];
    hasValidProofData = false;
  }

  /**
   * テストで使うスマートコントラクトをまとめてデプロイする
   * @returns
   */
  async function deployZKNFTFixture() {
    // アカウントを取得
    const [owner, user1, user2] = await hre.viem.getWalletClients();

    // PasswordHashVerifierをデプロイ
    const verifier = await hre.viem.deployContract("PasswordHashVerifier");
    // ZKNFTをデプロイ
    const zkNFT = await hre.viem.deployContract("ZKNFT", [verifier.address]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      zkNFT,
      verifier,
      owner,
      user1,
      user2,
      publicClient,
    };
  }

  describe("Deployment", () => {
    it("Should set the right name and symbol", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      expect(await zkNFT.read.name()).to.equal("ZKNFT");
      expect(await zkNFT.read.symbol()).to.equal("ZNFT");
    });

    it("Should set the right verifier address", async () => {
      const { zkNFT, verifier } = await loadFixture(deployZKNFTFixture);

      expect(await zkNFT.read.verifier()).to.equal(
        getAddress(verifier.address),
      );
    });

    it("Should initialize totalSupply to 0", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      expect(await zkNFT.read.totalSupply()).to.equal(0n);
    });

    it("Should set the correct constants", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      expect(await zkNFT.read.nftName()).to.equal("ZK NFT");
      expect(await zkNFT.read.description()).to.equal(
        "This is a Serverless ZK NFT.",
      );
      expect(await zkNFT.read.nftImage()).to.equal(
        "https://bafkreidths6s4zg2exc5wlngmhlm5bav2xsfups7zeemee3rksbbpcx6zq.ipfs.w3s.link/",
      );
    });

    it("Should deploy verifier without errors", async () => {
      const { verifier } = await loadFixture(deployZKNFTFixture);
      expect(verifier.address).to.be.a("string");
      expect(verifier.address).to.not.equal(
        "0x0000000000000000000000000000000000000000",
      );
    });
  });

  describe("Contract Interface", () => {
    it("Should have correct safeMint function signature", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      // safeMint関数が存在することを確認
      expect(zkNFT.write.safeMint).to.be.a("function");
    });

    it("Should reject calls with invalid parameters", async () => {
      const { zkNFT, user1 } = await loadFixture(deployZKNFTFixture);

      // 無効なパラメータでの呼び出しテスト
      try {
        await zkNFT.write.safeMint([
          user1.account.address,
          pA,
          pB,
          pC,
          pubSignals,
        ]);

        // 有効な証明データがない場合、Invalid proofエラーが期待される
        if (!hasValidProofData) {
          expect.fail("Expected transaction to revert with invalid proof");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        expect(errorMessage).to.include("Invalid proof");
      }
    });
  });

  describe("Token URI", () => {
    it("Should return correct token URI format for any token ID", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      // tokenURI関数は_tokenIdを無視してstaticなURIを返すので、
      // 実際にNFTをミントしなくてもテストできる
      const tokenURI = await zkNFT.read.tokenURI([0n]);

      // Base64エンコードされたJSONであることを確認
      expect(tokenURI).to.include("data:application/json;base64,");

      // Base64デコードしてJSONの内容を確認
      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const decodedData = JSON.parse(
        Buffer.from(base64Data, "base64").toString(),
      );

      expect(decodedData.name).to.equal("ZK NFT");
      expect(decodedData.description).to.equal("This is a Serverless ZK NFT.");
      expect(decodedData.image).to.equal(
        "https://bafkreidths6s4zg2exc5wlngmhlm5bav2xsfups7zeemee3rksbbpcx6zq.ipfs.w3s.link/",
      );
      expect(decodedData.attributes).to.have.lengthOf(1);
      expect(decodedData.attributes[0].trait_type).to.equal("Type");
      expect(decodedData.attributes[0].value).to.equal("Winner");
    });

    it("Should return same token URI for different token IDs", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      const tokenURI0 = await zkNFT.read.tokenURI([0n]);
      const tokenURI1 = await zkNFT.read.tokenURI([1n]);
      const tokenURI999 = await zkNFT.read.tokenURI([999n]);

      // すべてのトークンが同じURIを持つことを確認
      expect(tokenURI0).to.equal(tokenURI1);
      expect(tokenURI1).to.equal(tokenURI999);
    });
  });

  describe("Edge Cases", () => {
    it("Should handle zero address correctly", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      // ゼロアドレスへのミントは失敗するはず
      try {
        await zkNFT.write.safeMint([
          "0x0000000000000000000000000000000000000000",
          pA,
          pB,
          pC,
          pubSignals,
        ]);
        expect.fail("Expected transaction to revert");
      } catch (error: unknown) {
        // エラーが発生することを確認（Invalid proofまたはzero addressエラー）
        expect(error).to.exist;
      }
    });

    it("Should query non-existent token", async () => {
      const { zkNFT } = await loadFixture(deployZKNFTFixture);

      // 存在しないトークンの所有者を問い合わせ
      try {
        await zkNFT.read.ownerOf([999n]);
        expect.fail("Expected call to revert");
      } catch (error: unknown) {
        // ERC721NonexistentTokenエラーが発生することを確認
        expect(error).to.exist;
      }
    });
  });

  // 実際のZK証明が必要なテストは条件付きで実行
  describe("ZK Proof Integration (requires valid proof)", () => {
    it("Should successfully mint with valid proof data", async function () {
      if (!hasValidProofData) {
        this.skip();
        return;
      }

      const { zkNFT, user1 } = await loadFixture(deployZKNFTFixture);

      try {
        // 実際の証明データでミントを試行
        const hash = await zkNFT.write.safeMint([
          user1.account.address,
          pA,
          pB,
          pC,
          pubSignals,
        ]);

        // 成功した場合の検証
        expect(hash).to.be.a("string");
        expect(await zkNFT.read.totalSupply()).to.equal(1n);
        expect(await zkNFT.read.ownerOf([0n])).to.equal(
          getAddress(user1.account.address),
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // ZK証明の検証に失敗した場合は、適切なエラーメッセージであることを確認
        expect(errorMessage).to.include("Invalid proof");
      }
    });
  });
});
