# MC-Vector 事実整理

調査日: 2026-10-11
対象: `~/Documents/dev/JS/App/MC-Vector`（v2.0.63、branch `main`、HEAD `9bf746b`）

この文書は、MC-Vector のコードと公開ファイルから確認できた事実だけを集めたものです。動画の企画は `video-concept.md` に分けています。実機で確かめていない項目は、その旨を書いています。

---

## 1. 基本情報

| 項目 | 内容 | 出典 |
|---|---|---|
| 製品名 | MC-Vector | `src-tauri/tauri.conf.json` |
| バージョン | 2.0.63 | `package.json`、`src-tauri/Cargo.toml`、`tauri.conf.json` |
| 識別子 | `com.tukuyomi032.mcvector` | `src-tauri/tauri.conf.json` |
| 作者 / ライセンス | tukuyomil032 / MIT | `Cargo.toml`、README |
| 種別 | Minecraft サーバー管理のデスクトップアプリ | README |
| 技術 | Tauri v2、React 19.2、TypeScript、Vite 8、Tailwind 3、Zustand、Monaco Editor、Recharts、Framer Motion、TanStack Query / Virtual、Radix UI、Rust | `package.json`、`src-tauri/Cargo.toml` |
| 開発ツール | Bun 1.4.2、Oxlint / Oxfmt、Lefthook、Vitest、Playwright、`just` | `package.json` |
| 対応言語 | 英語と日本語 | `src/i18n/locales/en.ts`、`ja.ts` |
| 対応 OS（配布物あり） | macOS 10.15 以降（arm64 と x64）、Windows 10 以降（x64、NSIS インストーラー） | `.github/workflows/release.yml`、`tauri.conf.json` |
| Linux | 依存関係に `glib` などがあるが、配布物は作られていない。動画では出さない | 同上 |
| 必要な環境 | Java 17 以上（21 か 25 を推奨）、RAM 4 GB 以上を推奨 | README |
| リポジトリ | https://github.com/tukuyomil032/MC-Vector | README |
| リリース | https://github.com/tukuyomil032/MC-Vector/releases | README |
| ドキュメントサイト | https://tukuyomil032.github.io （Astro Starlight、リポジトリの `docs/` ディレクトリ） | `docs/src/content/docs/`、CSP |
| 自動更新の配信先 | https://tukuyomil032.github.io/MC-Vector/latest.json（minisign 署名付き） | `tauri.conf.json` |

### 導入方法（README 記載）

- macOS: `brew tap tukuyomil032/tap && brew install --cask mc-vector`
  - アプリは公証（notarize）されていないため、`xattr -cr /Applications/MC-Vector.app` が必要と README にある。
- Windows: `scoop bucket add tukuyomil032 https://github.com/tukuyomil032/homebrew-tap` の後に `scoop install mc-vector`
- 手動: GitHub Releases から `MC-Vector.dmg` か `MC-Vector-Setup.exe`

### リリース履歴

- 最初のコミットは 2025-12-05。
- v1.0.0 は 2025-12-09。
- 自動アップロードと自動更新は 2025-12-26 に入った。
- v2.0.x 系が続き、v2.0.63 が 2026-09-16 の最新。
- コミット 837 件、タグ 38 件（v1.0.0 から v2.0.63）。
- CHANGELOG ファイルはない。リリースノートは GitHub Releases とアプリ内の更新画面にある。

---

## 2. 画面と機能

### 2-1. 全体のレイアウト（`src/App.tsx`、`.app-shell`）

- 左のサイドバー（開いているときは 260px、閉じると 60px のアイコンだけ）。
- メイン領域は上に 60px のヘッダー、その下に角丸のコンテンツカード。
- ビューの切り替えは Framer Motion のフェード（10px のスライド、0.2 秒）。reduced-motion に対応している。
- 重いビュー（Dashboard、Files、Plugins、Settings）は遅延読み込み。
- サーバーが選ばれていないときは「select or create a server」の文字を中央に出す。

### 2-2. サイドバー

- ヘッダーは太字の「MC-Vector」という文字だけ。ロゴ画像は置いていない。ここをクリックすると App Settings が開く。
- ナビゲーション: Dashboard、Console、Users、Files、Plugins / Mods、Backups、Properties、General Settings。区切り線を挟んで Proxy Network。
- サーバー一覧は `groupName` でグループ分けされる（未分類は "Ungrouped"）。各行にステータスの点（オンライン緑、オフライン灰、起動中は黄色の点滅、停止中は赤、再起動中は青の回転、クラッシュは淡い赤の点滅）。
- 「Select」で一括選択モード。選んだサーバーに対して Start、Stop、Backup、Clear を行える。
- 右クリックメニュー: Duplicate、Save as template、Delete（赤）。
- 下部に破線の「+ Add Server」ボタン。

### 2-3. ヘッダー

- サーバー名と「 / ビュー名」を表示。
- Start（緑）、Restart、Stop（赤）ボタン。状態に応じて有効・無効が変わる。Proxy ビューでは隠れる。

### 2-4. ショートカットとコマンドパレット

- Cmd / Ctrl + K でコマンドパレット（cmdk）を開く。Esc で閉じる。
  - 「Navigate」は 7 ビューへの移動。
  - 「Server actions」は Start、もしくは Stop と Restart。
- Ctrl / Cmd + Tab と Ctrl / Cmd + Shift + Tab で 9 つの主要ビューを順に切り替える。
- OS 全体のグローバルショートカット（アプリが背面でも効く）: Cmd / Ctrl + Shift + S で開始・停止の切り替え、Cmd / Ctrl + Shift + R で再起動。
- Ctrl / Cmd + S でファイルエディタを保存。
- Console では ↑ / ↓ でコマンド履歴を呼び出せる。

### 2-5. トースト通知

- Sonner を右下に表示（`richColors`）。
- ダウンロードの進行は別のカードを右下に出す（タイトル、%、メッセージ、進捗バー）。

### 2-6. サーバーの作成とインポート

- 「Add Server」は、「New server」と「Import server」の2枚のカードを出す。
- New server は 1 画面のフォーム（多段ウィザードではない）。react-hook-form と zod で検証する。
  - テンプレート（保存済みがあるときだけ表示）。
  - 名前（`[A-Za-z0-9_-]` のみ）。保存先のパスを live で表示。
  - プロファイル名とグループ名（任意）。
  - ソフトウェア:
    - Standard: Vanilla、Paper（既定）、LeafMC、Spigot
    - Modded: Fabric、Forge
    - Proxy: Velocity、Waterfall、BungeeCord
  - バージョン（`src/renderer/constants/versionOptions.ts`、自動生成、26.3 から 1.x まで）。既定は Paper 1.21.10。
  - ポート（既定 25565）とメモリ（GB、既定 4）。
- 作成時は、ジャーの取得中にダウンロードの進行トーストが出る。
- Import は既存のサーバーフォルダーを選ぶ。ジャーのあるフォルダーからソフトウェア、バージョン、EULA の状態を読み取る。ジャーがなければエラーを出す。名前は取り込み前に編集できる。
- 初回起動時には EULA の同意ダイアログ（Mojang の規約へのリンクとチェックボックス）が出る。「Accept and start」で `eula.txt` を書いてから起動する。
- バージョンアップ（General Settings から開く Version Upgrade Wizard）: 最新版を取得、任意でバックアップ、ダウンロード、完了の 4 段階。サーバーは停止している必要がある。

### 2-7. Dashboard（`DashboardView.tsx`）

- ヘッダーカード: 「Dashboard: <名前>」、ソフトウェアとバージョン、色付きの状態語。
- KPI タイル 6 つ:
  - Status
  - Current TPS（18 以上は緑、15 以上は黄、それ未満は赤）
  - CPU %
  - Memory（MB）
  - Software と version
  - Uptime（HH:MM:SS のライブ表示）
- Recharts のエリアチャート 3 つ（直近 60 秒）:
  - CPU は空色 `#38bdf8`、0〜100 の固定軸
  - Memory は翠色 `#34d399`
  - TPS は緑 `#22c55e`、0〜22 の軸。データがなければ空の表示
- アニメーションは無効（線がなめらかに伸びず、流れるように更新される）。
- TPS は Paper と LeafMC で 5 秒ごとに `tps` コマンドを送って取得する。ほかのソフトウェアはログ行から読む。
- 高 CPU の通知（しきい値と 5 分のクールダウン）を設定できる。
- 注意: プレイヤー数のグラフは UI にない。i18n には `dashboard.healthCheck`（SLP の ping、遅延、プレイヤー数、版）の文字列があるが、`DashboardView` からは使われていない。SLP の健康チェックとプレイヤー数は画面に出ていない。

### 2-8. Console（`ConsoleView.tsx`）

- 上部の 3 欄:
  - ADDRESS: クリックでコピー。ローカルアドレスと ngrok の公開アドレスを切り替える。
  - STATUS: 色付きの語。
  - MEMORY: 「使用量 / 割り当て MB」。
- 検索バー: 「Find」で開く。正規表現の切り替え、前後の移動、件数表示、不正な正規表現のエラー。一致は黄色、現在の一致はオレンジ。Enter と Esc に対応。
- ログ表示:
  - 等幅フォント。ANSI の色は Rust 側の `parse_ansi_lines` で解析する。
  - 重大度の色: FATAL `#f43f5e` 太字、ERROR `#ef4444` 太字、WARN `#f59e0b` 太字、INFO `#d1d5db`。
  - 行をピン留めできる（最大 5 行の「Pinned logs」）。
  - 上にスクロールすると「Jump to latest」のチップが出る。
  - ログがないときは斜体で「Waiting for logs…」。
- 下部: 「Save Logs」（緑）、レベルの絞り込み（ALL、INFO、WARN、ERROR、FATAL）、`>` のプロンプトと入力欄、Send ボタン、「↑ / ↓ History」のヒント。
- コンソールの履歴は保存される（`console-history-commands.ts`）。
- 注意: xterm.js は依存に入っているが、実際に使われているかは未確認。ログは HTML の行として描画している。

### 2-9. Users（`UsersView.tsx`）

- 5 つの一覧: Online Players、Whitelist、Operators（レベル付き）、Banned Players、Banned IPs。
- 各一覧に件数、空の表示、追加の入力欄（プレイヤー名または IP）。
- オンラインのプレイヤーは Kick と Ban ができる。項目は削除できる。
- 頭のアイコン（24px）は `minotar.net` から取得し、失敗時は `MHF_Steve`。
- サーバー停止中は「offline」の注意を出す。

### 2-10. Files と Monaco エディタ（`FilesView.tsx`、`FileEditorWorkspace.tsx`）

- パンくず（サーバーフォルダーの外には出られない）と、ツールバー: 上へ、Create / Import、エクスプローラーで開く、Move、Compress（zip）、Extract（unzip）、Delete、Diff。
- ファイル一覧:
  - Ctrl / Cmd クリックの複数選択。
  - 右クリックメニュー: Rename、Move、Compress、Extract、Delete、New / Import。
  - 行をドラッグしてフォルダーに落とすと移動する。
  - OS からのドラッグ＆ドロップで、今のフォルダーにアップロード（「Drop here to upload into the current folder」）。
- Monaco エディタ:
  - テーマ `mc-vector-dark`（背景 `#111214`、文字 `#e4e4e7`）。フォントは 14px。ミニマップ付き。
  - ヘッダーは戻る矢印、ファイルアイコン、名前、未保存の点、「⌘ S」のヒント、保存ボタン（保存中はスピナー）。
  - ステータスバーに Ln/Col、UTF-8、LF、言語、読み取り専用、ミニマップと折り返しの設定。
- Diff ビュー: Monaco の DiffEditor を並べて表示する読み取り専用。元と変更後の 2 つのファイルを選ぶ。バイナリは受け付けない。

### 2-11. Plugins / Mods（`PluginBrowser.tsx`、約 3,160 行、最大のコンポーネント）

- 上部の切り替え: 「Browse」と「Installed (N)」。
- プラットフォームのカード（ソフトウェアに応じて変わる）:
  - Modrinth: Plugins + Mods、または Mods + Datapacks（常に表示）。
  - Hangar: Paper エコシステム（Paper のみ。Paper のロゴ `src/assets/papermc_logo.svg`）。
  - SpigotMC: Spiget API 経由（mod 以外のサーバー）。
  - CurseForge: 外部リンクのみ（mod サーバー）。CurseForge の API 連携はない。
- 検索欄。並び替えは Relevance、Downloads、Name、Compatibility。1 ページ 25 件、前後のページ送りと「Go to page」。
- 結果カード: アイコン、タイトル、作者、互換性バッジ（Compatible / Incompatible / Checking / Unknown）、説明、ダウンロード数、Install と Details のボタン。
- 詳細パネル: Info と README のタブ。
- インストールの流れ:
  - 必須の依存を検出し、先に入れるか聞く。
  - 上書き・重複のダイアログと、更新の流れ。
  - チェックサム、取得元、サイズの検査。エラーはトーストで出し、「Open General Settings」へのリンクを付ける。
- Installed タブ:
  - ファイルごとの有効・無効（`.disabled` へのリネーム）。
  - バージョンの推定と更新バッジ（「Update Available」か「Up to Date」。ツールチップに最新版）。更新件数の要約。

### 2-12. Backups（`BackupsView.tsx`、約 1,600 行、`BackupTargetSelectorWindow.tsx`）

- ヘッダーの「+ Create Backup」。仮想化リスト（`@tanstack/react-virtual`）。Full か Differential のバッジ、Differential の親の参照、Restore、Tag、削除。
- 作成モーダル: ZIP 名（任意）、圧縮レベル 1〜9、Full か Differential（前回からの変更分のみ）、「Select targets」。
- 対象選択は別の OS ウィンドウ（`?backupSelector=1`）で開く。折りたたみのファイルツリー、Select all、Clear all、件数、Apply。
- 処理中は「Creating…」。
- タグ編集モーダル（カンマ区切りのタグと メモ）。
- 保持数の警告はトーストで出す。自動バックアップの保持は General Settings で設定。
- ワールド管理: ワールドフォルダーの検出、Delete World（「バックアップがあることを確認したか」の二重確認）。
- 空のときは「No backups yet」。進捗はグローバルのストアで管理。
- 注意: `backup-restore.mdx` は Full と Differential の 2 種類を説明しているが、ADR-002 は差分を廃止して全量スナップショットに置き換える方針。出荷版で何が選べるかは要確認。

### 2-13. Properties（`properties/PropertiesView.tsx`、`AdvancedSettingsWindow.tsx`）

- `server.properties` のフォーム: Basic、Gameplay、Network の区分。
- MOTD、最大人数、ポート。Difficulty と Game mode は選択式。
- PvP、allow-flight、command blocks、online-mode、whitelist はトグル（各項目に説明）。
- 検索欄、「Save changes」、「Advanced」。
- Advanced ウィンドウ: General、Gameplay、World、Network、Security、Advanced の区分。「Apply and close」。説明文は `shared/propertiesData.ts`。

### 2-14. General Settings（`properties/ServerSettings.tsx`）

- 基本: 名前、プロファイル名、グループ名、ソフトウェア、バージョン、ポート。
- JVM 引数: プリセット（`shared/jvm-presets.ts`）、ヘルプ文、クリアボタン。
- Java のランタイム選択: 「System default」か管理中のランタイム。「Manage Java」で Java Manager を開く。
- 自動再起動（クラッシュ時）: 最大回数と待ち秒数。
- 自動バックアップ: 間隔、毎日か毎週、時刻、曜日、保持数（件数と日数）。
- 通知: 起動時、クラッシュ時、高 CPU（しきい値付き）。
- Ngrok の設定（2-18 を参照）。
- バージョンアップのボタン（ウィザードを開く）と保存ボタン。

### 2-15. Java Manager（`JavaManagerModal.tsx`）

- Adoptium のランタイムをダウンロードできるのは 8、17、21 だけ。
- 各バージョンに「Download」（進捗付き）か「Installed」のバッジ。
- 手動選択: 自分の Java のパスを指定できる。
- 「Installed runtimes」の一覧に削除（確認付き）。空のときは「No runtimes managed by MC-Vector」。
- 注意: README は Java 17 以上で 21 か 25 を推奨と書いているが、マネージャーは 25 を提供していない。

### 2-16. Proxy Network（`ProxySetupView.tsx`、`ProxyHelpView.tsx`）

- Velocity（推奨）、Waterfall、BungeeCord から選ぶ。プロキシのポート。バックエンドのサーバーにチェックを入れる。
- 「Build network」でプロキシを作り、バックエンドを接続する。バックエンドが 2 つ未満なら警告。
- 「View help」で、推奨ソフトウェアとポート、最小構成（プロキシ + バックエンド 2 つ）、チェックリストを出すガイド。
- 設定ファイルの生成は `proxy-commands.ts`。Velocity は `velocity.toml`、BungeeCord と Waterfall は `config.yml`。

### 2-17. App Settings（`SettingsWindow.tsx`）

- 「MC-Vector」の文字をクリックして開く。ウィンドウではなくビュー。
- Updates: 確認、進捗バー付きのダウンロード、「restart to install」、リリースノートの `<pre>`。
- Language: English / 日本語。
- Security: 「allow unverified plugin downloads」のチェック（黄色の警告付き）。
- Liquid Glass（実験的）: 設定はあるが、表示は変わらない（i18n に「does not change the appearance yet」とある）。トグルは実質的に何もしない。動画では出さない。
- 戻るボタンで Dashboard に戻る。

### 2-18. Ngrok（`ngrok-commands.ts`、`NgrokGuideView.tsx`）

- トグルで TCP トンネルを開始。トークンがなければ入力モーダル（「Save and connect」）。
- トンネルのログ: 「Initializing…」、「Ready」、ONLINE のバッジ、公開アドレスとコピー、「Share with friends」。
- 「Change token」でトークンを消す。
- Ngrok Guide ビュー: 3 段階（ダッシュボードを開く、Authtoken をコピー、アプリに入れる）。事前のチェックリストと、配信中にトークンを映さないよう注意する警告。

### 2-19. 自動更新（`AppUpdateModal.tsx`、`use-app-updater.ts`）

- 起動時にバージョン、リリースノート、進捗バー付きのダイアログ。Cancel、Download、Restart。
- 更新の配信先は `latest.json`。リリース版だけで有効（デバッグ版と E2E では動かない）。

### 2-20. 画面にないもの

- オンボーディングや初回案内はない。
- テーマの切り替えはない。テーマは `'dark'` だけ（`settingsStore.ts`、`THEME_PALETTE` も暗色のみ）。ドキュメントは「ライトモードは計画中」と書く。
- システムトレイはない。
- プレイヤー数のグラフはない。
- Spigot、Forge、Velocity、Waterfall、BungeeCord の jar は自動では取得されない（後述の 3 の Rust ホスト許可リストに含まれない）。

---

## 3. バックエンドの能力と安全設計

### 3-1. Tauri コマンド（`src-tauri/src/commands/`、`lib.rs` に登録。39 個）

- サーバー（`server.rs`）: `start_server`、`stop_server`（stdin に `stop` を書く）、`send_command`、`is_server_running`、`get_server_pid`。
- EULA（`eula.rs`）: `get_server_eula_status`、`accept_server_eula`。
- 計測（`process_stats.rs`、`health_check.rs`、`perf.rs`）: `get_server_stats`（sysinfo で CPU とメモリ）、`ping_server`（Minecraft の Server List Ping を Rust で実装）、`parse_ansi_lines`。
- ダウンロード（`download.rs`）: `download_server_jar`、`download_plugin_artifact`。
- Java（`java.rs`）: `download_java`（Adoptium の Temurin を展開）。
- Ngrok（`ngrok.rs`）: `start_ngrok`、`stop_ngrok`、`download_ngrok`、`is_ngrok_installed`、`get_ngrok_token_status`、`set_ngrok_token`、`clear_ngrok_token`。
- バックアップ（`backup.rs`）: `create_managed_backup`、`restore_managed_backup`、`list_managed_backups`、`delete_managed_backup`、`apply_managed_backup_retention`、`compress_managed_items`、`extract_managed_item`。
- ファイル（`file_utils.rs`）: 一覧、読み書き、フォルダー作成、移動、削除、インポート、テキストの書き出し、サーバーのインポート（段階的）、クローン、フォルダーの移行。
- 更新（`updater_utils.rs`）: `can_update_app`、`get_app_location`。
- Rust から UI へのイベント: `server-log`、`server-status-change`、`server-stats`、`backup-progress`、`java-download-progress`、`ngrok-status-change`、`ngrok-log`、`ngrok-download-progress`。

### 3-2. サーバープロセスの動き（`server.rs`）

- 同時に動かせるサーバーは最大 8 つ（`MAX_RUNNING_SERVERS`）。
- メモリは 256 MB から 64 GB の範囲に収める。
- コマンドは 100 ms 以上の間隔で送り、キューは 256 件まで。
- ログは 4096 行のリングバッファに入れ、50 ms ごとに最大 200 行まとめて UI に送る（大量のログでも UI が固まらない）。
- JVM 引数とJava の実行ファイルのパスは Rust 側で検査する。
- 操作ログを残す（`audit_server_action`）。

### 3-3. サーバーの状態検査（`health_check.rs`）

- 自前の Minecraft Server List Ping。接続とI/O のタイムアウトは 3 秒、同時 8 件、最低 1 秒の間隔。
- パケットと JSON、VarInt のサイズに上限。ローカルの宛先だけを許す。
- 注意: この機能は UI には出ていない（2-7 を参照）。

### 3-4. バックアップ（`backup.rs`、ADR-002、ADR-003）

現在のコードにあるもの:
- ZIP の作成と保存先は `…/MC-Vector/servers/<name>/backups/`（macOS は `~/Library/Application Support`、Windows は `%APPDATA%`）。
- 展開の上限: エントリ 100,000 件、圧縮後 2 GB、展開後 8 GB、1 エントリ 2 GB、パスの深さ 32、圧縮率 100。
- 進捗イベントの送信と保持（retention）。

ADR で定めた方針（状態は Proposed）:
- 全量の自己完結スナップショットとマニフェスト（差分をやめる）。
- 復元はトランザクション式: 別の場所に書いて検証してから入れ替える。サーバーが動いていれば拒否。
- 「停止してからバックアップ」が既定。ライブのスナップショットは「live」と表示し、通常の復元の対象にしない。
- 自動バックアップは必ず安全な停止の手順を使う。
- 保持は手動のバックアップを削除しない。

### 3-5. Java（`java.rs`、`java-commands.ts`）

- `download_java` は Adoptium（`api.adoptium.net`）から Temurin を取得する。
- ホストの許可リスト: `api.adoptium.net`、`github.com`、`objects.githubusercontent.com`、`release-assets.githubusercontent.com`。
- `.tar.gz` と `.zip` を展開。上限は 512 MB（アーカイブ）、10 万エントリ、8 GB、深さ 32、圧縮率 100。
- 危険な名前、シンボリックリンク、reparse point を拒否。
- 既存の入れ替えは、失敗したら元のインストールを残す。
- 注意: README は「runtime detection」と書いているが、`java.rs` にあるのはダウンロードとパスの検証だけ。ランタイムの一覧は `java-commands.ts` のストアで管理する。

### 3-6. Ngrok（`ngrok.rs`）

- ngrok v3 のエージェントを公式のアーカイブから取得する（許可されたホスト。サイズは 100 MB まで）。
- トンネルを子プロセスとして起動・停止し、ログと状態をイベントで流す。
- トークンは OS の資格情報ストアに保存（`keyring` クレート。macOS は Keychain、Windows は Credential Manager、Linux は Secret Service）。ADR-004 でレンダラー側の平文ストアから移した。
- UI はトークンの有無しか見られない。

### 3-7. プラグインの取得（`plugin-commands.ts`、`src/lib/adapters/plugin/`）

- 取得元: Modrinth、Hangar（PaperMC）、SpigotMC（Spiget API `api.spiget.org`）。
- インストール先はプラグインかモッドのフォルダー。
- Rust 側で `download_plugin_artifact` を行い、512 MB の上限、ホストの許可リスト、任意のチェックサムを検証する。
- Spigot の有料・外部リソースは、アダプターで印をつけている。動画で Spigot を見せるときは注意する。

### 3-8. ダウンロードの許可リスト（`SERVER_JAR_HOSTS`）

- `api.leafmc.one`、`api.papermc.io`、`fill.papermc.io`、`fill-data.papermc.io`、`meta.fabricmc.net`、`piston-data.mojang.com`。
- ワンクリックで取得できるのは Paper、LeafMC、Vanilla、Fabric。Spigot、Forge、Velocity、Waterfall、BungeeCord は jar の自動取得の対象外。動画で「ワンクリックで Forge」などとは言わない。

### 3-9. セキュリティ設計（ADR-000 から ADR-007）

| ADR | テーマ | 中身 |
|---|---|---|
| 001 | 操作の境界 | サーバーごとの非同期ロック（`ServerOperationManager`）。開始・停止・バックアップ・ファイル変更などを直列化。世代番号で古いプロセスの監視が新しいプロセスを消さない |
| 002 | バックアップと復元 | 全量スナップショット、トランザクション式の復元 |
| 003 | カタログと保持 | 再構築できるカタログ、手動バックアップを消さない保持、名前の衝突を避ける |
| 004 | 検証済みの成果物と秘密情報 | サーバー jar、プラグイン、Java、ngrok に SHA-256（とサイズ）の検証。トークンは keychain |
| 005 | 権限・CSP・パス・インポート | 最小権限の capability、厳しい CSP、絶対パス・`..`・NUL・シンボリックリンク・reparse point の拒否、段階的インポート |
| 006 | ビルドと実機 E2E | GitHub Actions を SHA で固定（`scripts/check-workflow-actions.mjs`）。実機の Tauri スモーク E2E（`scripts/tauri-smoke-e2e.mjs`）と Playwright のモック E2E |
| 007 | 検証と採点 | 証拠の区分（単体テスト済み、Rust 統合テスト済み、実機の Tauri でテスト済み など）と上限の規則 |

- 注意: ADR はすべて「Proposed」。「監査済み」とは言わず、「設計で固めている」と言う。

### 3-10. CSP と権限（`tauri.conf.json`、`src-tauri/capabilities/`）

- CSP: `script-src 'self'`、`object-src 'none'`、`frame-ancestors 'none'`、`base-uri 'none'`、`form-action 'none'`。`connect-src` は名前を挙げたホストだけ。
- capability は目的ごとに分けている: `default.json`、`main-artifact-install.json`（HTTP を許可リストで制限）、`main-backup.json`（store のみ）、`main-server-runtime.json`（process のみ）、`backup-selector.json`。
- `tauri-plugin-shell` は依存にあるが、どの capability にもシェルの実行権限はない。
- レンダラー側: Tauri コマンドの許可リスト（`tauri-command-allowlist.ts`）、Markdown に `rehype-sanitize`、`dompurify` を固定。

### 3-11. その他の技術

- `tauri-plugin-updater` はリリース版だけで有効。
- 単一インスタンス（2 つ目を起動すると既存のウィンドウを前に出す）。
- ウィンドウの位置と大きさを記憶する。
- Rust の最低版は 1.77.2。
- macOS の dev 専用に `tauri-plugin-webdriver-automation`。

---

## 4. デザイン要素

### 4-1. 色（zinc 系、単色＋意味の色）

| 役割 | 値 |
|---|---|
| 背景 | `#09090b` |
| カード・パネル | `#18181b`（別の候補 `#1c1c1f`） |
| ホバー | `#3f3f46` |
| 境界線 | `#27272a`（強い境界 `#3f3f46`） |
| 文字（主） | `#f4f4f5` / `#fafafa` |
| 文字（副） | `#d4d4d8` / `#a1a1aa` |
| 文字（淡） | `#71717a` |
| アクセント | `#ffffff`（ホバー `#e4e4e7`）。選択中のチップは白地に黒文字 |
| 成功 | `#10b981`（グラデーション `#22c55e` から `#10b981`） |
| 危険 | `#ef4444` |
| 警告 | `#f59e0b`（グラデーション `#f97316` まで） |
| 情報 | `#3b82f6` |
| グラフ | 空色 `#38bdf8`、翠色 `#34d399`、緑 `#22c55e` |
| エディタ | 背景 `#111214`、文字 `#e4e4e7` |
| ウィンドウ背景 | `#0f0f11` |

- 注意: 一括選択のチェックボックスは `#5865F2`（Discord の青紫）が使われている。統一感を損なう。
- ライトモード用の変数は `design-tokens.css` の `:root` にあるが、実行時には使われていない。

### 4-2. 形・フォント

- フォントは Inter を指定しているが、同梱していない（`@font-face` もフォントパッケージもない）。Inter が入っていない機械では系統の sans-serif になる。
- 等幅は Menlo、Monaco、Consolas、Courier New。
- カードは角丸 16px（`rounded-2xl`）。境界線つきで、影は弱い。全体は平らな見た目。

### 4-3. アニメーション

- モーダル: 背景のフェード 180ms、パネルのスケールと持ち上がり 200ms（`cubic-bezier(0.16,1,0.3,1)`）。
- ビューのクロスフェード（2-1）。
- 状態の点の点滅、サーバー行のホバーで `translate-x-0.5`。
- `scaleIn` はバウンス系のイージング。

### 4-4. アイコンとロゴ

- アプリのアイコン（`src-tauri/icons/`、`build/icon.icns`、`build/icon.ico`）: 紺の円、青緑のピクセル調の「M」、黄金の上向き矢印。
- ドキュメントの商標（`docs/public/logo.svg`、`docs/src/assets/logo.svg`）: 黒の角丸正方形に白い「V」のシェブロンと「MC-Vector」の文字。`favicon.svg` も同じ系統。
- 注意: アプリのアイコン（M と矢印）と、ドキュメントのロゴ（V）は別のデザイン。どちらを正とするかを決めてから使う。
- アプリ内の画像ロゴはない（テキストの「MC-Vector」だけ）。
- 線のアイコン（`src/assets/icons/*.svg`、18 個）: backups、console、dashboard、file、files、folder、import、menu、move、open-folder、plugins、properties、proxy、settings、trash、unzip、users、zip。
- Paper のロゴ（`src/assets/papermc_logo.svg`）。

---

## 5. 既存のキャッチコピーと言い回し

- README の見出し: 「Minecraft - Multi-Function Server Management Software」
- README の紹介: 「a powerful cross-platform desktop application for managing Minecraft servers with ease. Built with Tauri and React, it provides a modern, fast, and intuitive interface for server administration.」
- ドキュメントのトップ: 「Manage your Minecraft servers with ease. Monitor performance, browse plugins, edit files, and automate backups, all from a single desktop app.」
- 機能の見出し（README）: 「Port Forwarding Elimination」、「Plugins/mods … with one click」、「Real-Time Monitoring」、「Backup & Restore … with ease」、「Built-in File Manager」、「Proxy Network Setup」、「Java Version Management」、「Auto-Updater」。
- ADR 側の言い回し: 「raising MC-Vector from a roughly 5-6 point implementation to a release-ready 9.5-10 point」。ただし ADR は提案段階なので、動画では使わない。
- 使えそうな型: 「all from a single desktop app」、「no port forwarding」、「one click」。

---

## 6. 動画で言い切ってはいけない点

| 項目 | 理由 |
|---|---|
| Linux 対応 | 配布物がない（macOS と Windows のみ） |
| 「ワンクリックで Forge / Velocity / Spigot」 | 自動取得は Paper、LeafMC、Vanilla、Fabric のみ |
| プレイヤー数のグラフ、SLP の健康チェック | UI にない |
| 「リアルタイム監視」の範囲 | CPU、メモリ、TPS、稼働時間まで。プレイヤー数は含まない |
| Liquid Glass | 実装されていない。トグルは何も変えない |
| テーマの切り替え、ライトモード | 存在しない（ダークのみ） |
| 差分バックアップ | ドキュメントは Differential と書くが、ADR-002 は全量に置き換える。出荷版で確認が必要 |
| 「監査済み」「本番品質の検証済み」 | ADR はすべて Proposed |
| Java 25 対応 | マネージャーは 8、17、21 のみ |
| 「runtime detection」 | 実態はダウンロードとパスの検証。ランタイム一覧は別のストアで管理 |
| CurseForge の連携 | 外部リンクだけで、API 連携はない |
| Spigot の取り扱い | 有料や外部リソースがあるため、映すときは注意 |
| 「署名・公証済み」 | macOS アプリは未公証。`xattr -cr` が必要と README にある |
| アプリのロゴ | ドキュメントの V とアプリの M・矢印が別物。どちらを使うか未決 |
| フォント（Inter） | 同梱していないため、録画機の環境で見た目が変わる |
| 「星の数」 | リポジトリ内に数字はない（バッジは GitHub 側で表示） |

注意: README には存在しない `security.rs` が載っている。動画の字幕やナレーションで引用しない。

---

## 7. 出典

- `README.md`
- `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/capabilities/`
- `src-tauri/src/commands/*.rs`、`src-tauri/src/state/`
- `src/App.tsx`、`src/renderer/components/**`、`src/renderer/constants/versionOptions.ts`
- `src/lib/*.ts`、`src/lib/adapters/plugin/`
- `src/store/settingsStore.ts`、`src/i18n/locales/{en,ja}.ts`
- `src/styles/`（`base/design-tokens.css` など）
- `spec/ADR-000-index.md` と `spec/ADR-001` から `ADR-007`
- `docs/src/content/docs/`（ガイドのページ）
- `.github/workflows/release.yml`、`.github/workflows/update-versions.yml`
- `git log`（リリースとコミットの数）

---

## 7. v4 で追加した数字とセキュリティの 5 項目(2026-10-11 に確認)

### 7-1. 容量と起動時間(実測)

- インストール後の容量: macOS の `/Applications/MC-Vector.app` は 31 MB(ディスク上)。動画では「about 30 MB」と出し、小さく「installed on macOS · about 14 MB to download」と添える。
- ダウンロードの大きさ(GitHub Releases v2.0.63): `MC-Vector_2.0.63_aarch64.dmg` 14 MB、`x64.dmg` 15 MB、Windows の `setup.exe` 8 MB。
- 起動時間: `open -a` からウィンドウ(高さ 200 px 超)が画面に出るまでを 8 回計測(Apple M1、`CGWindowListCopyWindowInfo` を 10 ms 間隔で確認)。結果は 1344、935、609、337、309、333、303、363 ms。初回の 3 回はキャッシュが温まる前で、4 回目以降(温まった状態)は約 0.3 秒。動画では「opens in about 0.3 s」と出し、「window up, measured on an M1 Mac」と注記する。
- 注意: 「ウィンドウが出るまで」の時間で、画面の中身が描かれ終わるまでではない。コールドスタート(初回)は約 1 秒。

### 7-2. セキュリティの 5 項目(コードで確認したもの)

| # | 動画の表記 | 根拠 |
|---|---|---|
| 1 | Strict CSP | `src-tauri/tauri.conf.json` の `csp`: `script-src 'self'`、`object-src 'none'`、`base-uri 'none'`、`frame-ancestors 'none'`、`form-action 'none'`、`connect-src` は名前を挙げたホストだけ |
| 2 | Least-privilege permissions | `src-tauri/capabilities/` が目的別に 5 つ(`default`、`main-artifact-install`、`main-backup`、`main-server-runtime`、`backup-selector`)。どれにもシェル実行の権限はない |
| 3 | Allow-listed downloads | `SERVER_JAR_HOSTS`、Java のホスト許可リスト、プラグインは `download_plugin_artifact` で 512 MB 上限とホスト許可リストと任意のチェックサム、ngrok は 100 MB 上限 |
| 4 | Tokens in the OS keychain | `Cargo.toml` の `keyring`(apple-native、windows-native)。ngrok のトークンは OS の資格情報ストアに保存し、UI は有無だけを見る |
| 5 | Safe archive handling | `java.rs`、`backup.rs` の展開上限(エントリ数、サイズ、深さ 32、圧縮率 100)と、`..`・絶対パス・シンボリックリンク・reparse point の拒否 |

- 使う見出し: 「Built to be safe.」。使わない言葉: audited、signed、certified、secure by default、unhackable。ADR の番号も出さない(ADR はすべて Proposed)。
- 「Rust · Tauri」は事実メモ 3 章のとおり。
