// popup.js - 設定画面のロジック

document.addEventListener('DOMContentLoaded', async () => {
    const promptTextarea = document.getElementById('prompt-template');
    const saveButton = document.getElementById('save-prompt');
    const saveStatus = document.getElementById('save-status');
    const presetButtons = document.querySelectorAll('.preset');
    
    // 保存されているプロンプトを読み込む
    try {
        const result = await chrome.storage.sync.get(['promptTemplate']);
        if (result.promptTemplate) {
            promptTextarea.value = result.promptTemplate;
        }
    } catch (error) {
        console.error('プロンプト読み込みエラー:', error);
    }
    
    // 保存ボタンのクリックイベント
    saveButton.addEventListener('click', async () => {
        const promptText = promptTextarea.value.trim();
        
        try {
            // Chrome Storage APIに保存
            await chrome.storage.sync.set({ promptTemplate: promptText });
            
            // 成功メッセージを表示
            showStatus('保存しました', 'success');
        } catch (error) {
            console.error('保存エラー:', error);
            showStatus('保存に失敗しました', 'error');
        }
    });
    
    // プリセットボタンのクリックイベント
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const promptText = button.getAttribute('data-prompt');
            promptTextarea.value = promptText;
            // 自動的に保存
            saveButton.click();
        });
    });
    
    // テキストエリアの変更を監視
    promptTextarea.addEventListener('input', () => {
        // 保存ボタンを有効化（必要に応じて）
        saveButton.disabled = false;
    });
    
    // ステータスメッセージを表示する関数
    function showStatus(message, type) {
        saveStatus.textContent = message;
        saveStatus.className = `save-status show ${type}`;
        
        // 3秒後に非表示
        setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 3000);
    }
    
    // Enterキーで保存（Ctrl/Cmd + Enter）
    promptTextarea.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            saveButton.click();
        }
    });
});