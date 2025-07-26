# ブロックチェーンとゼロ知識証明で作るフルスタックサーバーレスアプリケーション

## 動かし方

- インストール

  ```bash
  pnpm i
  ```

  - `circuit`側

    - コンパイル

      ```bash
      pnpm circuit run compile
      ```

    - verify 用の solidity ファイルなどを生成する

      ```bash
      pnpm circuit run executeGroth16
      ```

    - witness ファイルを生成する

      ```bash
      pnpm circuit run generateWitness
      ```

    - verify 用の Solidity ファイルを backend フォルダ配下に移す

      ```bash
      pnpm circuit run cp:verifier
      ```

    - zk 用のファイルを backend と frontend フォルダ配下に移す

      ```bash
      pnpm circuit run cp:zk
      ```

  - `backend`側

    - コンパイル

      ```bash
      pnpm backend run compile
      ```

    - テスト

      ```bash
      pnpm backend run test
      ```

    - スマートコントラクトのデプロイ

      ```bash
      pnpm backend run deploy:ZKNFT --network base-sepolia
      ```

    - スマートコントラクトを verify

      ```bash
      pnpm backend run verify chain-84532 --include-unrelated-contracts
      ```

    - 総発行数を取得する

      ```bash
      pnpm backend run totalSupply --network base-sepolia
      ```

    - NFT をミントする

      ```bash
      pnpm backend run mint --network base-sepolia
      ```

  - `frontend`側

    - ビルド

      ```bash
      pnpm frontend run build
      ```

    - フロントエンド起動

      ```bash
      pnpm frontend run dev
      ```

## デプロイ済みのコントラクト情報

