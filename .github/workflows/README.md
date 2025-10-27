# GitHub Actions Workflows

このディレクトリにはGitHub Actionsのワークフロー設定が含まれています。

## ワークフロー

### test.yml
**Unit & Component Tests** - ユニットテストとコンポーネントテストを実行します。

- トリガー: `push`と`pull_request`イベント
- 実行内容:
  - Node.js 20のセットアップ
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

### デプロイ

**Vercelでの自動デプロイ** - GitHubのmainブランチにpushされると、Vercelが自動的にデプロイします。

- Vercelの自動デプロイが有効になっているため、追加の設定は不要です
- Vercelダッシュボードでデプロイ状況を確認できます

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

