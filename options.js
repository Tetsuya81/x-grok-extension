// options.js - 設定画面のロジック

// デフォルトプリセット
const DEFAULT_PRESETS = [
    { text: 'この投稿を要約してください' },
    { text: 'この投稿を日本語に翻訳してください' },
    { text: 'この投稿の内容を分析してください' },
    { text: 'この投稿について詳しく説明してください' }
];

let currentPresets = [];
let editingIndex = -1;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadPresets();
    renderPresets();
});

// プリセットを読み込み
async function loadPresets() {
    try {
        const result = await chrome.storage.sync.get(['customPresets']);
        if (result.customPresets && result.customPresets.length > 0) {
            currentPresets = result.customPresets;
        } else {
            // デフォルトプリセットを設定
            currentPresets = [...DEFAULT_PRESETS];
            await chrome.storage.sync.set({ customPresets: currentPresets });
        }
    } catch (error) {
        console.error('プリセット読み込みエラー:', error);
        currentPresets = [...DEFAULT_PRESETS];
    }
}

// プリセットを保存
async function savePresets() {
    try {
        await chrome.storage.sync.set({ customPresets: currentPresets });
        showStatus('設定が保存されました', 'success');
    } catch (error) {
        console.error('プリセット保存エラー:', error);
        showStatus('保存に失敗しました', 'error');
    }
}

// プリセット一覧を描画
function renderPresets() {
    const presetList = document.getElementById('preset-list');
    presetList.innerHTML = '';
    
    currentPresets.forEach((preset, index) => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        
        item.innerHTML = `
            <div class="preset-content">
                <div class="preset-text">${escapeHtml(preset.text)}</div>
            </div>
            <div class="preset-actions">
                <button class="btn btn-edit" onclick="editPreset(${index})">編集</button>
                <button class="btn btn-delete" onclick="deletePreset(${index})">削除</button>
            </div>
        `;
        
        presetList.appendChild(item);
    });
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ステータスメッセージを表示
function showStatus(message, type) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type} show`;
    
    setTimeout(() => {
        statusElement.classList.remove('show');
    }, 3000);
}

// 新しいプリセット追加フォームを表示
function showAddPresetForm() {
    const form = document.getElementById('add-preset-form');
    form.classList.add('show');
    document.getElementById('new-text').focus();
}

// 新しいプリセット追加をキャンセル
function cancelAddPreset() {
    const form = document.getElementById('add-preset-form');
    form.classList.remove('show');
    
    // フォームをリセット
    document.getElementById('new-text').value = '';
}

// 新しいプリセットを保存
async function saveNewPreset() {
    const text = document.getElementById('new-text').value.trim();
    
    // バリデーション
    if (!text) {
        showStatus('プロンプトテキストを入力してください', 'error');
        return;
    }
    
    // プリセットを追加
    const newPreset = { text };
    currentPresets.push(newPreset);
    
    await savePresets();
    renderPresets();
    cancelAddPreset();
}

// プリセットを編集
function editPreset(index) {
    editingIndex = index;
    const preset = currentPresets[index];
    
    document.getElementById('edit-text').value = preset.text;
    
    document.getElementById('edit-modal').classList.add('show');
}

// 編集をキャンセル
function cancelEdit() {
    editingIndex = -1;
    document.getElementById('edit-modal').classList.remove('show');
}

// 編集を保存
async function saveEdit() {
    if (editingIndex === -1) return;
    
    const text = document.getElementById('edit-text').value.trim();
    
    // バリデーション
    if (!text) {
        showStatus('プロンプトテキストを入力してください', 'error');
        return;
    }
    
    // プリセットを更新
    currentPresets[editingIndex] = { text };
    
    await savePresets();
    renderPresets();
    cancelEdit();
}

// プリセットを削除
async function deletePreset(index) {
    if (confirm('このプリセットを削除しますか？')) {
        currentPresets.splice(index, 1);
        await savePresets();
        renderPresets();
    }
}

// モーダルの外側をクリックして閉じる
document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        cancelEdit();
    }
});

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('edit-modal').classList.contains('show')) {
            cancelEdit();
        }
    }
});

// フォームのEnterキー送信を防ぐ
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
    }
});