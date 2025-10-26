# GitHub Actions Workflows

このディレクトリにはGitHub Actionsのワークフロー設定が含まれています。

## ワークフロー

### test.yml
**Unit & Component Tests** - ユニットテストとコンポーネントテストを実行します。

- トリガー: `push`と`pull_request`イベント
- 実行内容:
  - Node.js 18のセットアップ
  - 依存関係のインストール
  - Jestによるテスト実行とカバレッジレポート生成
  - Codecovへのカバレッジアップロード

**E2E Tests** - ブラウザテストを実行します。

- Playwrightを使用したE2Eテスト
- Chromiumブラウザでのテスト実行
- テスト結果のアーティファクト保存

**Build Check** - ビルドが正常に完了することを確認します。

- Next.jsアプリケーションのビルド
- ビルド成果物の保存

### deploy.yml
**Deploy to Vercel** - メインブランチへのマージ時にVercelへデプロイします。

- トリガー: `main`ブランチへの`push`
- 実行内容:
  - テストの実行
  - Vercelへのデプロイ

## セットアップ

### 必要なシークレット（Vercelデプロイ用）

1. **VERCEL_TOKEN**: Vercel APIトークン
   - Vercelダッシュボード > Settings > Tokens から取得

2. **VERCEL_ORG_ID**: Vercel組織ID
   - VercelダッシュボードのURLバーから取得

3. **VERCEL_PROJECT_ID**: VercelプロジェクトID
   - Vercelダッシュボードのプロジェクト設定から取得

### GitHubリポジトリにシークレットを追加

1. リポジトリのSettings > Secrets and variables > Actionsに移動
2. "New repository secret"をクリック
3. 上記のシークレットを追加

## ローカルでのテスト実行

```bash
# ユニットテストとコンポーネントテスト
npm test

# カバレッジ付きテスト
npm run test:coverage

# E2Eテスト
npm run test:e2e

# ビルドチェック
npm run build
```

