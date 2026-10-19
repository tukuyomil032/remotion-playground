# Snapzy ファクトシート

Snapzy の非公式プロモーション動画のために、確認できた事実をまとめたメモです。各項目の末尾に出典を付けています。（README）は GitHub の README、（サイト）は公式サイト、（インストール版）はローカルの /Applications/Snapzy.app です。確認日は 2026-10-19 です。

## 1. 概要

- 一行説明（README の tagline を原文のまま引用）: "Native macOS screenshots, recording, annotation, and editing from the menu bar."（README）
- 作者: GitHub ユーザー duongductrong（README）
- ライセンス: BSD 3-Clause License（README）
- 動作要件: Requires macOS 13.0 or later.（README）。サイトでは "Requires macOS 13+." と表記（サイト）
- インストール方法
  - Homebrew: `brew install --cask snapzy`（README）
  - GitHub Releases の DMG（README）、install.sh を使うシェルスクリプト（README）
- 価格（サイトの Pricing 節の表記）
  - プラン "Community"、価格 "Free forever" と $0、ボタン "Download Free"（サイト）
  - プラン "Supporter"、価格 "Voluntary"、説明に "Pay what you want"（サイト）
  - "Ko-fi Direct" は価格欄が "Instant" のカードで、プランではなく支払い手段の案内です（サイト）
- 署名と公証: Developer ID で署名され、Apple による notarization を受けています（README）。サイトでは "Notarized by Apple." と記載（サイト）

## 2. 機能

### スクリーンショット

- 撮影モード: Fullscreen、Area（範囲指定）、Application window（Application Capture を切り替えて使い、既定のキーは `A`）（README）
- Active window: 前面のアプリのウィンドウを、きれいな端と macOS 風のドロップシャドウ付きで撮影（サイト）
- Delayed capture: 範囲指定の遅延撮影（README の URL scheme 一覧にある `snapzy://capture/delayed`）。設定できるカウントダウン（サイト）
- Repeat last area: 直前に指定した範囲を再撮影（README）
- Smart element capture: ボタン、カード、メニューなどの UI 要素を自動検出してスナップ（README、サイト）
- Scrolling capture: 長いページや文書を一度に撮影（サイト）。ライブのプレビュー付きで連結（README）
- OCR: 文字の抽出は Apple Vision、またはカスタムの OpenAI 互換エンドポイントで実行（README）。画像や動画フレームから文字を認識し、クリップボードにコピー（サイト）
- Object cutout: 背景を取り除いて被写体を切り出し（README、サイトの "Subject Capture"）
- Window shadow: macOS 14 以降で利用可能（README）
- 書き出し形式: PNG、JPG、WebP（README）
- Precision Magnifier: ピクセル格子付きのルーペで RGB または HEX の色値をコピー（サイト）
- Capture Markup: 撮影前の画面に矢印、コールアウト、番号付きステップを描画（サイト）

### 画面録画

- 動画または GIF で出力（README）。システム音声とマイクに対応（README、サイト）
- カメラのオーバーレイ（iPhone の Continuity Camera に対応）、クリックのハイライト、キー入力のオーバーレイ、録画中のライブ注釈、直前に指定した範囲の記憶、GIF のリサイズ（README）

### 注釈エディタ（Annotate）

- ツール: shapes、arrows（Bezier のハンドルで曲線を調整）、text、watermarks、filled rectangles、blur や pixelate、機密情報の自動マスク、counters、highlighter、ズームとパン（README）。番号付きステップ（サイト）
- 切り抜き: エッジスナップ付きの crop と、`A` キーで内容に合わせる自動クロップ（README）
- 背景: remove background、3D レンダラーによる mockup 背景（README）。ワンクリックの背景（サイト）
- 角丸: 角丸を調整する設定は、README にもサイトにもありません。README にある角丸の記述は、メニューバーのポップオーバーを撮影した際に透過の角丸で保存される動作の説明です（README）
- padding: 注釈エディタについての記載はありません。padding は動画エディタの項目を参照してください（README、サイト）

### 動画エディタ（Video Editor）

- トリム: 視覚的なタイムラインとフレームストリップ（README）。クリップのトリムと、再生速度の調整、クロップ（サイト）
- ズーム区間: Follow Mouse による自動フォーカス（README、サイト）
- 背景: wallpaper の背景と padding（README）。canvas wallpapers（サイト）
- 書き出し: カスタムの書き出しサイズ（README）。MP4 または animated GIF（サイト）
- animated GIF のビューア、undo と redo（README）

### Quick Access

- 撮影のたびに表示される浮動カード（README）。サイトでは "A pinned floating preview after each capture" と記載（サイト）
- 操作: copy、edit、drag-to-app、二本指のスワイプで閉じる、open、delete、Pin to screen（README）

### キャプチャ履歴

- 最近のスクリーンショット、動画、GIF を、浮動パネルと一覧画面で確認（README）
- 種類と日時のフィルター、ファイル名の検索、コピー、開く、削除（README）
- Annotate または Video Editor で再び開く、保持期間のポリシー（README）
- 過去のキャプチャの検索とフィルター、メタデータ、オフラインでの保存（サイト）

### オンボーディング

- スプラッシュ画面、初回起動時の言語選択、権限設定のガイド、ショートカットの設定（README）。Guided permission setup、shortcut preferences、interactive tour（サイト）

### 多言語対応と外観

- README の Localization では 10 言語が挙がっています。英語、ベトナム語、簡体字中国語、繁体字中国語、スペイン語、日本語、韓国語、ロシア語、フランス語、ドイツ語です（README）
- サイトでは英語（United States）が有効で、ベトナム語、簡体字中国語、繁体字中国語、日本語、韓国語、ロシア語が対応とされ、スペイン語、フランス語、ドイツ語は "Coming soon" と表記されています（サイト）。両者で言語数が一致しないため、動画で数字を使う前に確認が必要です
- macOS のアプリごとの言語設定に従い、再起動なしで切り替え可能（サイト）
- 外観: light、dark、system のテーマに対応（README）

### その他

- クラウドアップロード: 自分で用意する AWS S3 または Cloudflare R2 に送信（README）。認証情報は macOS の Keychain に保存（README）。README の Security 節には Google Drive も挙がっています（README）
- 設定の書き出しと読み込み: TOML 形式、`~/.config/snapzy/config.toml`（README）
- `snapzy://` URL scheme と Raycast 拡張による操作、Sparkle によるアプリ内アップデート（README）

## 3. 既定のショートカット

README の Shortcuts 節の表を、そのまま載せています。

| 操作 | ショートカット |
|---|---|
| Fullscreen screenshot | `⇧⌘3` |
| Area screenshot | `⇧⌘4` |
| ↳ Toggle manual/app window mode (`Application Capture`) | `A` |
| Repeat last area screenshot | `⌃⌘⇧4` |
| Area screenshot + inline annotate | `⇧⌘7` |
| Scrolling screenshot | `⇧⌘6` |
| Screen recording (start/stop toggle) | `⇧⌘5` |
| Pause/Resume recording (optional, recommended `⌘⇧Space`) | 既定値なし |
| OCR text capture | `⇧⌘2` |
| Object cutout capture | `⇧⌘1` |
| Smart element capture | `⌥⇧4` |
| Open Annotate | `⇧⌘A` |
| Open Video Editor | `⇧⌘E` |
| Open Cloud Uploads | `⇧⌘L` |
| Show shortcuts list | `⇧⌘K` |

Quick Access card のショートカットです。カードにカーソルを乗せている間のみ有効です（README）。

| 操作 | ショートカット |
|---|---|
| Copy | `⌘C` |
| Save / Open | `⌘S` |
| Edit | `⌘E` |
| Upload to cloud | `⌘U` |
| Pin to screen | `⌘P` |
| Delete | `⌘⌫` |
| Close | `⌘W` |

## 4. プライバシーと安全の記述

README の Security 節の記述です。原文のまま引用し、言い換えていません。

- 署名、公証、ランタイム: "It ships with the macOS Hardened Runtime enabled, is Developer ID signed and notarized by Apple, and declares a minimal set of entitlements; library validation stays on, so the app can only load code signed by Snapzy or by Apple."（README）
- サンドボックス: "Snapzy is not sandboxed" に続けて "it runs with your user account's privileges."（README）
- 通信: "Network requests are limited to Sparkle update checks, local loopback OAuth callback redirection, user-initiated cloud uploads to your own cloud storage (AWS S3, Cloudflare R2, or Google Drive), and optional user-initiated OCR model downloads from HTTPS/Hugging Face sources the user explicitly defines."（README）
- OCR モデル: "Snapzy bundles no OCR models and its model catalog ships empty, so no model is referenced or fetched unless you add one."（README）
- OCR の処理: "The default built-in OCR engine runs entirely on-device; if you explicitly add a custom OCR endpoint in Settings, OCR requests (including the captured image) go to that endpoint."（README）
- Keychain: "Cloud credentials and OAuth tokens are stored exclusively in the macOS Keychain, can be further protected with an optional password (SHA-256 hashed, never stored in plaintext), and can only be transferred via a manual encrypted export/import flow protected by a user-supplied archive passphrase."（README）
- カスタム OCR の API キー: "Custom OCR endpoint API keys are likewise stored only in the macOS Keychain and are never included in config or credential exports."（README）
- テレメトリ: "Snapzy collects no telemetry."（README）
- 脆弱性の報告: "To report a vulnerability, please use a GitHub Security Advisory or contact the maintainer privately."（README）

サイトでは "Zero telemetry"、"Notarized by Apple."、Supporter 節の "Zero paywalls, no ads, no tracking." と記載されています（サイト）。
"100% on-device OCR" とありますが、README の表現よりも範囲が広く見えます。動画では使わず、README の "The default built-in OCR engine runs entirely on-device" の表現を優先してください。

## 5. 動画で言わない・見せないこと

- 他社製品(CleanShot X など)との比較
- OCR の精度の数字
- 「監査済み」「完全に安全」などの保証
- 録画で操作していない機能を操作として見せること(スクロールキャプチャ、画面録画、クラウドアップロードは名前を出す程度)
- 作者や利用者の発言の捏造
- 価格や対応 OS をソースにない形で言い換えること

補足として、README には OCR のベンチマーク表（2026-04-19 時点）がありますが、数字は本資料に転記していません。

## 6. 出典

- README: https://github.com/duongductrong/Snapzy（確認日 2026-10-19）。WebFetch では要約しか取得できず、raw の README.md は 404 だったため、原文は `gh api repos/duongductrong/Snapzy/readme` で取得しました。
- 公式サイト: https://snapzy.app（確認日 2026-10-19）。WebFetch の要約で確認しているため、語句の細部が原文と異なる可能性があります。
- インストール版: /Applications/Snapzy.app/Contents/Info.plist の CFBundleShortVersionString は 2.1.0-beta.6 です（確認日 2026-10-19）。README とサイトの記述が同じバージョンを指すかは確認していません。
