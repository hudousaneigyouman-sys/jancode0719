<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#0f172a">
  <title>コードメモ</title>
  <link rel="manifest" href="manifest.json">
  <link rel="stylesheet" href="styles.css">
  <script src="app.js" defer></script>
</head>
<body>
  <header class="app-header">
    <div>
      <h1>コードメモ</h1>
      <p>音声または文字で登録・検索</p>
    </div>
    <button id="exportBtn" class="ghost small" type="button">CSV保存</button>
  </header>

  <main>
    <section class="card">
      <label for="searchInput">商品を検索</label>
      <div class="search-row">
        <input id="searchInput" type="search" placeholder="商品名またはコードを1文字以上入力" autocomplete="off">
        <button id="searchBtn" class="primary" type="button">検索</button>
      </div>
      <p class="help">1文字入力して検索すると、登録済みの商品を一覧表示します。</p>
      <div class="row-actions">
        <button id="showAllBtn" class="ghost" type="button">すべて表示</button>
        <button id="clearSearchBtn" class="ghost" type="button">検索を消す</button>
      </div>
    </section>

    <section class="card">
      <div class="section-title-row">
        <h2 id="listTitle">登録一覧</h2>
        <span id="countBadge" class="badge">0件</span>
      </div>
      <div id="itemList" class="item-list" aria-live="polite"></div>
      <p id="emptyMessage" class="empty">まだ商品が登録されていません。</p>
    </section>
  </main>

  <button id="openAddBtn" class="fab" type="button" aria-label="商品を追加">＋</button>

  <dialog id="addDialog">
    <form id="addForm" class="dialog-card">
      <div class="dialog-head">
        <h2>商品を追加</h2>
        <button id="closeAddBtn" class="icon-btn" type="button" aria-label="閉じる">×</button>
      </div>

      <label for="codeInput">コード <strong>必須</strong></label>
      <div class="voice-row">
        <input id="codeInput" required inputmode="numeric" placeholder="番号を入力、またはマイクで話す">
        <button id="voiceCodeBtn" class="voice-btn" type="button">🎤 番号を話す</button>
      </div>
      <p id="voiceStatus" class="status">数字は1桁ずつ、ゆっくり話すと認識しやすくなります。</p>

      <label for="nameInput">商品名 <strong>必須</strong></label>
      <input id="nameInput" required placeholder="自由に分かりやすい名前を入力">

      <details>
        <summary>任意項目を開く</summary>
        <label for="memoInput">メモ</label>
        <textarea id="memoInput" rows="3" placeholder="購入先、用途など"></textarea>
      </details>

      <p id="formError" class="error" role="alert"></p>
      <div class="dialog-actions">
        <button id="previewRegisterBtn" class="primary full" type="submit">内容を確認する</button>
      </div>
    </form>
  </dialog>

  <dialog id="confirmDialog">
    <div class="dialog-card">
      <div class="dialog-head">
        <h2>登録内容の確認</h2>
        <button id="closeConfirmBtn" class="icon-btn" type="button" aria-label="閉じる">×</button>
      </div>
      <p class="confirm-label">コード</p>
      <div id="confirmCode" class="confirm-value code-value"></div>
      <p class="confirm-label">商品名</p>
      <div id="confirmName" class="confirm-value"></div>
      <p class="help">番号と商品名を目で確認して、正しければ「OK・登録」を押してください。</p>
      <div class="dialog-actions split">
        <button id="backToEditBtn" class="ghost" type="button">修正する</button>
        <button id="confirmRegisterBtn" class="primary" type="button">OK・登録</button>
      </div>
    </div>
  </dialog>

  <dialog id="editDialog">
    <div class="dialog-card">
      <div class="dialog-head">
        <h2>商品を編集</h2>
        <button id="closeEditBtn" class="icon-btn" type="button" aria-label="閉じる">×</button>
      </div>
      <label for="editCode">コード <strong>必須</strong></label>
      <input id="editCode">
      <label for="editName">商品名 <strong>必須</strong></label>
      <input id="editName">
      <label for="editMemo">メモ</label>
      <textarea id="editMemo" rows="3"></textarea>
      <p id="editError" class="error" role="alert"></p>
      <div class="dialog-actions split">
        <button id="deleteBtn" class="danger" type="button">削除</button>
        <button id="saveEditBtn" class="primary" type="button">変更を保存</button>
      </div>
    </div>
  </dialog>

  <nav class="bottom-nav">
    <button id="navSearch" class="active" type="button">検索</button>
    <button id="navAdd" type="button">登録</button>
    <button id="navList" type="button">一覧</button>
  </nav>
</body>
</html>
