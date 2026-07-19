const STORAGE_KEY = 'code-memo-items-v1';
let items = loadItems();
let selectedId = null;

const $ = (id) => document.getElementById(id);
const normalize = (text='') => text.normalize('NFKC').toLowerCase().replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const escapeCsv = (v='') => `"${String(v).replaceAll('"','""')}"`;

function loadItems(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveItems(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function render(){
  const q = normalize($('searchInput').value.trim());
  const filtered = items
    .filter(x => !q || normalize(x.name).includes(q) || normalize(x.code).includes(q))
    .sort((a,b) => a.name.localeCompare(b.name, 'ja'));
  $('listTitle').textContent = q ? `「${$('searchInput').value}」の検索結果` : '登録一覧';
  $('countBadge').textContent = `${filtered.length}件`;
  $('itemList').innerHTML = '';
  $('emptyMessage').hidden = filtered.length > 0;
  if (!items.length) $('emptyMessage').textContent = 'まだ商品が登録されていません。';
  else if (!filtered.length) $('emptyMessage').textContent = '該当する商品がありません。';
  filtered.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'item';
    btn.innerHTML = `<div><div class="item-name"></div><div class="item-code"></div></div><div class="item-arrow">›</div>`;
    btn.querySelector('.item-name').textContent = item.name;
    btn.querySelector('.item-code').textContent = item.code;
    btn.addEventListener('click', () => openDetail(item.id));
    $('itemList').appendChild(btn);
  });
}
function isDuplicate(code, excludeId=null){ return items.some(x => normalize(x.code) === normalize(code) && x.id !== excludeId); }
function addOne(keepOpen=false){
  const code = $('codeInput').value.trim();
  const name = $('nameInput').value.trim();
  const memo = $('memoInput').value.trim();
  $('formError').textContent = '';
  if (!code || !name) { $('formError').textContent = 'コードと商品名を入力してください。'; return false; }
  if (isDuplicate(code)) { $('formError').textContent = '同じコードがすでに登録されています。'; return false; }
  items.push({ id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2)), code, name, memo, createdAt: new Date().toISOString() });
  saveItems(); render(); $('addForm').reset();
  if (!keepOpen) $('addDialog').close(); else $('codeInput').focus();
  return true;
}
function openDetail(id){
  const item = items.find(x => x.id === id); if (!item) return;
  selectedId = id; $('detailCode').value = item.code; $('detailName').value = item.name; $('detailMemo').value = item.memo || '';
  $('detailDialog').showModal();
}
function createBulkRow(code='', name='', warning=false){
  const row = document.createElement('div'); row.className = `bulk-row${warning ? ' warn' : ''}`;
  row.innerHTML = `<input type="checkbox" checked aria-label="登録対象"><input class="bulk-code" placeholder="コード"><input class="bulk-name" placeholder="商品名">`;
  row.querySelector('.bulk-code').value = code;
  row.querySelector('.bulk-name').value = name;
  $('bulkRows').appendChild(row);
}
function looksLikeCode(token){ return /^[A-Za-z0-9][A-Za-z0-9._\-/]{3,}$/.test(token) && (/\d/.test(token)); }
function parseOcrText(text){
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const parsed = [];
  for (const line of lines){
    const cleaned = line.replace(/[|｜]/g,' ').replace(/\s+/g,' ').trim();
    const parts = cleaned.split(' ');
    let code='', name='';
    if (parts.length >= 2){
      const first = parts[0], last = parts[parts.length-1];
      if (looksLikeCode(first)) { code = first; name = parts.slice(1).join(' '); }
      else if (looksLikeCode(last)) { code = last; name = parts.slice(0,-1).join(' '); }
      else {
        const idx = parts.findIndex(looksLikeCode);
        if (idx >= 0) { code = parts[idx]; name = parts.filter((_,i)=>i!==idx).join(' '); }
      }
    }
    if (code || name) parsed.push({code, name, warning: !(code && name)});
  }
  return parsed;
}
async function runOcr(){
  const files = [...$('photoInput').files];
  if (!files.length) { $('ocrStatus').textContent = '写真を選択してください。'; return; }
  if (!window.Tesseract) { $('ocrStatus').textContent = '文字認識機能を読み込めませんでした。通信状態を確認してください。'; return; }
  $('ocrBtn').disabled = true; $('bulkRows').innerHTML='';
  let all=[];
  try {
    for (let i=0;i<files.length;i++){
      $('ocrStatus').textContent = `${i+1}/${files.length}枚目を読み取り中…`;
      const result = await Tesseract.recognize(files[i], 'jpn+eng', {
        logger: m => { if (m.status === 'recognizing text') $('ocrStatus').textContent = `${i+1}/${files.length}枚目：${Math.round((m.progress||0)*100)}%`; }
      });
      all = all.concat(parseOcrText(result.data.text));
    }
    all.forEach(x => createBulkRow(x.code, x.name, x.warning));
    if (!all.length) createBulkRow('', '', true);
    $('ocrStatus').textContent = `${all.length}件の候補を作成しました。内容を確認してください。`;
  } catch(e){ $('ocrStatus').textContent = `読み取りに失敗しました：${e.message}`; }
  finally { $('ocrBtn').disabled = false; }
}
function registerBulk(){
  const rows = [...document.querySelectorAll('.bulk-row')];
  let added=0, skipped=0;
  for (const row of rows){
    if (!row.querySelector('input[type="checkbox"]').checked) continue;
    const code = row.querySelector('.bulk-code').value.trim();
    const name = row.querySelector('.bulk-name').value.trim();
    if (!code || !name || isDuplicate(code)) { skipped++; row.classList.add('warn'); continue; }
    items.push({ id: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2)), code, name, memo:'', createdAt:new Date().toISOString() }); added++;
  }
  saveItems(); render();
  $('ocrStatus').textContent = `${added}件を登録しました。${skipped ? `${skipped}件は未入力または重複のため保留です。` : ''}`;
  if (!skipped) setTimeout(() => $('bulkDialog').close(), 500);
}
function exportCsv(){
  const csv = ['コード,商品名,メモ,登録日', ...items.map(x => [x.code,x.name,x.memo||'',x.createdAt].map(escapeCsv).join(','))].join('\n');
  const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='code-memo.csv'; a.click(); URL.revokeObjectURL(a.href);
}



let scannerControls = null;
let scannerTarget = 'code';
let scannerReader = null;
let scannerStream = null;

function stopScanner(){
  try { if (scannerControls && scannerControls.stop) scannerControls.stop(); } catch(e){}
  scannerControls = null;
  try { if (scannerReader && scannerReader.reset) scannerReader.reset(); } catch(e){}
  if (scannerStream) scannerStream.getTracks().forEach(t => t.stop());
  scannerStream = null;
  const video = $('scannerVideo');
  if (video) { try { video.pause(); } catch(e){} video.srcObject = null; }
}
function applyScannedCode(code){
  code = String(code || '').trim();
  if (!code) return;
  if (scannerTarget === 'search') {
    $('searchInput').value = code;
    render();
  } else {
    $('codeInput').value = code;
    $('nameInput').focus();
  }
  $('scannerStatus').textContent = `読み取り成功：${code}`;
  if (navigator.vibrate) navigator.vibrate(120);
  setTimeout(() => { stopScanner(); if ($('scannerDialog').open) $('scannerDialog').close(); }, 450);
}
function cameraErrorMessage(err){
  const n = err && err.name;
  if (n === 'NotAllowedError' || n === 'PermissionDeniedError') return 'カメラが許可されていません。Chromeのサイト設定でカメラを「許可」にしてください。';
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError') return '利用できるカメラが見つかりません。';
  if (n === 'NotReadableError' || n === 'TrackStartError') return 'カメラを起動できません。他のカメラアプリを閉じて、もう一度お試しください。';
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'このブラウザでは直接カメラを起動できません。「写真から読む」をお使いください。';
  return `カメラを起動できません：${err && err.message ? err.message : '不明なエラー'}`;
}
async function startScanner(target='code'){
  scannerTarget = target;
  stopScanner();
  $('scannerDialog').showModal();
  $('scannerStatus').textContent = 'カメラの使用を許可してください…';
  if (!window.isSecureContext) { $('scannerStatus').textContent = 'カメラはHTTPSで開いた場合のみ利用できます。'; return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('scannerStatus').textContent = '直接カメラを起動できません。「写真から読む」をお使いください。'; return; }
  try {
    if (window.ZXingBrowser && ZXingBrowser.BrowserMultiFormatReader) {
      scannerReader = new ZXingBrowser.BrowserMultiFormatReader();
      $('scannerStatus').textContent = 'バーコードを枠内に映してください。';
      scannerControls = await scannerReader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        $('scannerVideo'),
        (result, error, controls) => {
          if (controls) scannerControls = controls;
          if (result) applyScannedCode(result.getText ? result.getText() : result.text);
        }
      );
    } else {
      scannerStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      $('scannerVideo').srcObject = scannerStream;
      await $('scannerVideo').play();
      $('scannerStatus').textContent = '読み取り機能の読み込みに失敗しました。「写真から読む」をお使いください。';
    }
  } catch(err){ $('scannerStatus').textContent = cameraErrorMessage(err); }
}
async function decodeBarcodePhoto(file){
  if (!file) return;
  $('scannerStatus').textContent = '写真からバーコードを解析中…';
  try {
    if (!window.ZXingBrowser || !ZXingBrowser.BrowserMultiFormatReader) throw new Error('読み取り機能を読み込めませんでした。通信状態をご確認ください。');
    const url = URL.createObjectURL(file);
    try {
      const reader = new ZXingBrowser.BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(url);
      applyScannedCode(result.getText ? result.getText() : result.text);
    } finally { URL.revokeObjectURL(url); }
  } catch(err){ $('scannerStatus').textContent = `写真から読み取れませんでした。明るい場所でバーコード全体を大きく撮影してください。${err.message ? `（${err.message}）` : ''}`; }
}

$('searchInput').addEventListener('input', render);
$('scanCodeBtn').addEventListener('click', () => startScanner('code'));
$('scanSearchBtn').addEventListener('click', () => startScanner('search'));
$('closeScannerBtn').addEventListener('click', () => { stopScanner(); $('scannerDialog').close(); });
$('retryScannerBtn').addEventListener('click', () => startScanner(scannerTarget));
$('barcodePhotoInput').addEventListener('change', e => decodeBarcodePhoto(e.target.files && e.target.files[0]));
$('scannerDialog').addEventListener('close', stopScanner);
$('showAllBtn').addEventListener('click', () => { $('searchInput').value=''; render(); });
$('clearSearchBtn').addEventListener('click', () => { $('searchInput').value=''; $('searchInput').focus(); render(); });
$('openAddBtn').addEventListener('click', () => $('addDialog').showModal());
$('navAdd').addEventListener('click', () => $('addDialog').showModal());
$('navBulk').addEventListener('click', () => $('bulkDialog').showModal());
$('navSearch').addEventListener('click', () => { $('searchInput').focus(); window.scrollTo({top:0,behavior:'smooth'}); });
$('closeAddBtn').addEventListener('click', () => $('addDialog').close());
$('closeBulkBtn').addEventListener('click', () => $('bulkDialog').close());
$('closeDetailBtn').addEventListener('click', () => $('detailDialog').close());
$('addForm').addEventListener('submit', e => { e.preventDefault(); addOne(false); });
$('saveAndContinueBtn').addEventListener('click', () => addOne(true));
$('ocrBtn').addEventListener('click', runOcr);
$('addBulkRowBtn').addEventListener('click', () => createBulkRow());
$('registerBulkBtn').addEventListener('click', registerBulk);
$('exportBtn').addEventListener('click', exportCsv);
$('updateBtn').addEventListener('click', () => {
  const item = items.find(x => x.id === selectedId); if (!item) return;
  const code=$('detailCode').value.trim(), name=$('detailName').value.trim();
  if (!code || !name) return alert('コードと商品名は必須です。');
  if (isDuplicate(code, selectedId)) return alert('同じコードが登録されています。');
  item.code=code; item.name=name; item.memo=$('detailMemo').value.trim(); saveItems(); render(); $('detailDialog').close();
});
$('deleteBtn').addEventListener('click', () => {
  if (!confirm('この商品を削除しますか？')) return;
  items = items.filter(x => x.id !== selectedId); saveItems(); render(); $('detailDialog').close();
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
