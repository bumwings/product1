# 気分チェック - ポジティブ度

入力した文章をAIで分析し、0〜100点のポジティブ度をゲージで表示するアプリです。

## 構成

- **index.html** … フロント。入力文をサーバーの `/score` にPOSTし、返ってきたスコアをゲージ表示
- **server.js** … Node.js + Express。環境変数 `OPENAI_API_KEY` でOpenAI APIを呼び、0〜100の整数だけをJSONで返す。エラー時は50を返す

## 起動手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **OpenAI API キーの設定**
   - [OpenAI](https://platform.openai.com/) でAPIキーを取得し、環境変数に設定する。
   - **Windows (PowerShell):**
     ```powershell
     $env:OPENAI_API_KEY = "sk-xxxxxxxx"
     ```
   - **Windows (コマンドプロンプト):**
     ```cmd
     set OPENAI_API_KEY=sk-xxxxxxxx
     ```
   - **Mac / Linux:**
     ```bash
     export OPENAI_API_KEY=sk-xxxxxxxx
     ```
   - 未設定の場合は `/score` は常に 50 を返します。

3. **サーバーの起動**
   ```bash
   npm start
   ```
   または
   ```bash
   node server.js
   ```

4. **ブラウザで開く**
   - ブラウザで **http://localhost:3000** を開く
   - 気分を入力して「ポジティブ度をチェック」を押すと、AIがスコアを返しゲージに表示されます

## ポートの変更

別のポートで動かす場合は環境変数 `PORT` を指定します。

```bash
PORT=8080 node server.js
```

Windows PowerShell の場合:
```powershell
$env:PORT = "8080"; node server.js
```
