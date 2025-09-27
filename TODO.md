# TODOアプリ仕様書

## 1. 概要

Tauri、React、Mantine UI、SQLiteを使用して構築するデスクトップ向けTODOアプリケーション。

## 2. 機能要件

### 2.1. TODO管理

- [ ] **作成 (Create)**
    - [ ] TODOアイテムを新規作成できる。
    - [x] 入力項目:
        - [x] タイトル (必須)
        - [x] 詳細 (任意)
        - [x] 優先度 (高・中・低、デフォルトは中)
        - [x] 期限 (日付, 任意)
- [ ] **読み取り (Read)**
    - [x] TODOアイテムを一覧で表示できる。
    - [x] 完了済みのアイテムは見た目を変更して区別する（例: 取り消し線）。
    - [ ] 優先度、期限日時でソートできる。
    - [ ] タイトルや詳細の内容でフィルタリング（検索）できる。
- [ ] **更新 (Update)**
    - [ ] 既存のTODOアイテムを編集できる。
    - [x] 完了・未完了の状態を切り替えられる。
- [ ] **アーカイブ (Archive)**
    - [x] フロントエンドからの削除操作時、TODOアイテムを`archives`テーブルに移動させる（アーカイブする）。
    - [ ] 完了済みのアイテムを一括でアーカイブできる。
    - [x] アーカイブされたアイテムは通常の一覧画面には表示されない。

### 2.2. セクション管理

- [ ] **作成 (Create)**
    - [ ] 新しいセクションを作成できる。
    - [ ] 入力項目:
        - [ ] セクション名 (必須)
- [ ] **読み取り (Read)**
    - [ ] セクションを一覧で表示できる。
    - [ ] セクションごとにTODOリストをグループ化して表示する。
- [ ] **更新 (Update)**
    - [ ] セクション名を編集できる。
- [ ] **削除 (Delete)**
    - [ ] セクションを削除できる。
    - [ ] セクションに紐づくTODOアイテムの扱いは要検討（例: セクションなしに移動、または同時に削除）。

## 3. 画面設計 (UI/UX)

Mantine UIコンポーネントを活用し、直感的でモダンなUIを構築する。

- [ ] **メインレイアウト (`AppShell`)**
    - [x] ヘッダーにアプリケーションタイトルを配置。
    - [ ] 「新規TODO追加」ボタンを配置。
- [x] **TODO一覧**
    - [x] `Card`または`Table`コンポーネントを使用してTODOリストを表示。
    - [x] 各アイテムには、完了状態を示す`Checkbox`、タイトル、優先度、期限を表示。
    - [x] 各アイテムに「編集」と「削除」の`ActionIcon`を配置。
- [ ] **TODO作成・編集フォーム**
    - [ ] `Modal`コンポーネントでフォームを表示。
    - [ ] `TextInput`: タイトル
    - [ ] `Textarea`: 詳細
    - [ ] `Select`: 優先度
    - [ ] `DatePicker`: 期限
    - [ ] `Button`: 保存、キャンセル
- [ ] **セクション表示**
    - [ ] Todoist風のカンバンボードUIを実装する。
    - [ ] セクションなしのTODOは最初の列に表示する。
    - [ ] 各セクションは縦の列として表示し、その中に含まれるTODOをリスト表示する。
    - [ ] 各セクション列のヘッダーにセクション名と「新規TODO追加」ボタンを配置する。
    - [ ] 列の最後に「セクションを追加」ボタンを配置する。
- [ ] **フィルタリングとソート**
    - [ ] `TextInput`で検索バーを設置。
    - [ ] `Select`でソート順（優先度順、期限順）を選択できるようにする。

## 4. データモデル (SQLite)

`tauri-plugin-sql` を使用してデータベース操作を行う。

- [x] **`todos` テーブル**
    - [x] `id`: `INTEGER` - プライマリキー、自動インクリメント
    - [x] `title`: `TEXT` - タイトル (NULL不可)
    - [x] `description`: `TEXT` - 詳細
    - [x] `priority`: `TEXT` - 優先度 ('high', 'medium', 'low')
    - [x] `due_date`: `TEXT` - 期限 (ISO 8601 形式の文字列)
    - [x] `completed`: `INTEGER` - 完了フラグ (0: 未完了, 1: 完了)
    - [x] `created_at`: `TEXT` - 作成日時 (デフォルトで現在時刻)
    - [x] `updated_at`: `TEXT` - 更新日時 (更新時に現在時刻)

- [x] **`archives` テーブル**
    - [x] `todos`テーブルと同じ構造を持つ。アーカイブされたTODOアイテムを格納する。
    - [x] `archived_at`: `TEXT` - アーカイブ日時 (デフォルトで現在時刻) を追加。

- [ ] **`sections` テーブル**
    - [ ] `id`: `INTEGER` - プライマリキー、自動インクリメント
    - [ ] `name`: `TEXT` - セクション名 (NULL不可)
    - [ ] `created_at`: `TEXT` - 作成日時 (デフォルトで現在時刻)
    - [ ] `updated_at`: `TEXT` - 更新日時 (更新時に現在時刻)

## 5. バックエンド (Tauri - Rust)

フロントエンドから呼び出されるRust関数を定義する。

- [x] `get_todos()`: 全てのTODOを取得する。
- [x] `add_todo(title, description, priority, due_date)`: 新しいTODOを追加する。
- [x] `update_todo(id, title, description, priority, due_date)`: TODOを更新する。
- [x] `toggle_todo_completed(id)`: TODOの完了状態を切り替える。
- [x] `archive_todo(id)`: TODOを`archives`テーブルに移動する。
- [ ] `archive_completed_todos()`: 完了済みのTODOを`archives`テーブルに移動する。
- [ ] `delete_todo_permanently(id)`: TODOを完全に削除する（主に内部用）。

- [ ] `get_sections()`: 全てのセクションを取得する。
- [ ] `create_section(name)`: 新しいセクションを追加する。
- [ ] `update_section(id, name)`: セクションを更新する。
- [ ] `delete_section(id)`: セクションを削除する。