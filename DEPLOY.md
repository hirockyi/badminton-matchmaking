# 🏸 バドミントン対戦組み合わせアプリ デプロイ手順書

本アプリはフロントエンドのみで完結（サーバーサイドゼロ）しているため、無料の静的Webホスティングサービスで公開できます。

---

## 選択肢 1: GitHub Pages（推奨・最も手軽）

リポジトリ内に自動デプロイ用の設定ファイル（`.github/workflows/deploy.yml`）を用意済みです。
GitHub にプッシュして設定を1箇所変更するだけで、自動でビルド＆公開されます。

### 手順

1. **Git の初期化と GitHub へのプッシュ**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<あなたのGitHubユーザー名>/<リポジトリ名>.git
   git push -u origin main
   ```

2. **GitHub の設定で Pages を有効化**:
   1. ブラウザで GitHub のリポジトリページを開きます。
   2. **Settings** タブをクリックします。
   3. 左メニューの **Pages** を選択します。
   4. **Build and deployment** の **Source** を **`GitHub Actions`** に変更します。

3. **公開完了**:
   - 数分後に GitHub Actions のデプロイが完了し、`https://<あなたのGitHubユーザー名>.github.io/<リポジトリ名>/` に公開されます。

---

## 選択肢 2: Azure Static Web Apps（無料プラン）

カスタムドメインや無料SSL証明書を自動で使いたい場合におすすめです。

### 手順

1. **Azure Portal にログイン**:
   - [Azure Portal](https://portal.azure.com/) にアクセスします。

2. **Static Web Apps の作成**:
   - 「静的 Web アプリ (Static Web Apps)」を検索し、**作成** をクリックします。
   - **プランの種類**: `Free`（無料）を選択します。
   - **デプロイの詳細**: ソースに `GitHub` を選択し、本リポジトリとブランチ（`main`）を選択します。

3. **ビルドの構成**:
   - **ビルドのプリセット**: `Custom`
   - **アプリの場所**: `/`
   - **Api の場所**: （空欄）
   - **出力場所**: `dist`

4. **確認および作成**:
   - 「作成」をクリックすると、GitHub Actions ワークフローが自動でリポジトリに追加され、デプロイが始まります。

---

## 選択肢 3: Cloudflare Pages（無料・高速）

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. 本リポジトリを選択
4. ビルド設定:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Save and Deploy** をクリック

---

## 選択肢 4: 手動ビルドして任意のサーバーにアップロード

`dist/` フォルダをそのまま配信するだけで動作します。

```bash
# ビルド実行
npm run build
```
生成された `dist/` フォルダ内のファイル一式を、任意のWebサーバー（Apache, Nginx, S3, GCSバケットなど）に配置してください。
`base: './'`（相対パス）でビルドされるため、サブディレクトリ配下でもそのまま動作します。
