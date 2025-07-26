# フロントエンドの作成を依頼した時のプロンプト

```markdown
あなたは超優秀なフロントエンドエンジニアです。

以下の要件を満たす最適なフロントエンドアプリを実装してください。
よろしくお願いします。

## 画面
- ログイン画面. 
  - 認証を行う画面。
  - 画面中央部にログインボタンが配置されている非常にシンプルな画面
  - 認証機能はPrivyのものをそのまま流用する
  - もし認証済みであればそのままNFTミント画面に遷移する

- NFTミント画面. 
  - 画面タイトルが上部にあり、画面中央にパスワードを入力するフォームとNFTをミントするボタンが配置されている非常にシンプルな画面. 
  - パスワードを入力したら`ZKNFT`コントラクトのsafeMintメソッドが呼び出される。  
  - もし正しいパスワードであればそのままNFTのミントに成功する。  
  - 失敗した場合にはエラーが発生する。
  - NFTのミントに作成した場合は、「NFTを確認する」ボタンを描画し、NFTマーケットプレイスに遷移できるようにする
  - 遷移先のURLは次のとおりとする `https://testnet.rarible.com/user/${privyのウォレットアドレス}/owned`
  - ヘッダーコンポーネントを作成し、画面右上にログアウトボタンを配置する

## その他要望
- react toasterを使ってください。
- ローディングコンポーネントはカッコよく仕上げてください。
- 全体的な画面デザインはモダンでかっこいいデザインにしてください。

## 参考文献

実装する上で以下のドキュメントやGitHubリポジトリが非常に参考になると思いますので必ず参照してください。

Privy + Biconomyのインテグレーションガイドの解説ページ
https://github.com/bcnmy/abstract-docs/blob/main/docs/pages/new/integration-guides/wallets-and-signers/privy.mdx

GitHub - Privy + Next.jsの参考実装
https://github.com/privy-io/create-next-app

use context7
use deepwiki
```