# playwright

Node version: 24.13.0

## setup

### 依存パッケージインストール

```sh
npm install
```

### 環境変数設定

`.env.example` を `.env` にリネーム  
`.env` ファイルを編集

## 開放待ちの施設を取得

```sh
npm run search
```

開放待ち施設があれば候補が出るので、選択する
選択されたものは `src/targetReserve.json` に書き込まれる

## 予約実行

```sh
npm run reserve
```

7時ジャストに実行するため6:54までにコマンドを実行してください  
6:55になると事前に認証を通します  
6:59になると検索直前の画面で待機します  
7:00になると検索を行い、予約まで行います
