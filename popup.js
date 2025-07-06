// popup.js - 設定画面のロジック

document.addEventListener('DOMContentLoaded', async () => {
    const promptTextarea = document.getElementById('prompt-template');
    const saveButton = document.getElementById('save-prompt');
    const saveStatus = document.getElementById('save-status');
    const presetCards = document.querySelectorAll('.preset-card');
    const currentPromptDisplay = document.getElementById('current-prompt');
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    
    let currentPrompt = '';
    let promptHistory = [];
    
    // 初期化：保存されているプロンプトと履歴を読み込む
    async function initialize() {
        try {
            const result = await chrome.storage.sync.get(['promptTemplate', 'promptHistory']);
            
            if (result.promptTemplate) {
                currentPrompt = result.promptTemplate;
                updateCurrentPromptDisplay();
                
                // 保存されているプロンプトと一致するプリセットを選択状態にする
                presetCards.forEach(card => {
                    if (card.getAttribute('data-prompt') === currentPrompt) {
                        card.classList.add('selected');
                    }
                });
                
                // カスタムプロンプトの場合はテキストエリアに表示
                const isPreset = Array.from(presetCards).some(card => 
                    card.getAttribute('data-prompt') === currentPrompt
                );
                if (!isPreset && currentPrompt) {
                    promptTextarea.value = currentPrompt;
                }
            }
            
            if (result.promptHistory) {
                promptHistory = result.promptHistory;
                updateHistoryDisplay();
            }
        } catch (error) {
            console.error('初期化エラー:', error);
        }
    }
    
    // 現在のプロンプト表示を更新
    function updateCurrentPromptDisplay() {
        if (currentPrompt) {
            currentPromptDisplay.textContent = currentPrompt;
            currentPromptDisplay.style.fontStyle = 'normal';
        } else {
            currentPromptDisplay.textContent = '未選択';
            currentPromptDisplay.style.fontStyle = 'italic';
        }
    }
    
    // プロンプトを保存
    async function savePrompt(promptText) {
        try {
            // プロンプトを保存
            await chrome.storage.sync.set({ promptTemplate: promptText });
            currentPrompt = promptText;
            
            // 履歴に追加（重複を除く）
            promptHistory = promptHistory.filter(item => item.text !== promptText);
            promptHistory.unshift({
                text: promptText,
                timestamp: Date.now()
            });
            
            // 履歴を最大5件に制限
            if (promptHistory.length > 5) {
                promptHistory = promptHistory.slice(0, 5);
            }
            
            // 履歴を保存
            await chrome.storage.sync.set({ promptHistory: promptHistory });
            
            updateCurrentPromptDisplay();
            updateHistoryDisplay();
            
            return true;
        } catch (error) {
            console.error('保存エラー:', error);
            return false;
        }
    }
    
    // 履歴表示を更新
    function updateHistoryDisplay() {
        if (promptHistory.length === 0) {
            historySection.style.display = 'none';
            return;
        }
        
        historySection.style.display = 'block';
        historyList.innerHTML = '';
        
        promptHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'history-text';
            textSpan.textContent = item.text;
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'history-time';
            timeSpan.textContent = formatTime(item.timestamp);
            
            historyItem.appendChild(textSpan);
            historyItem.appendChild(timeSpan);
            
            // クリックで選択
            historyItem.addEventListener('click', async () => {
                selectPrompt(item.text);
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    // 時刻をフォーマット
    function formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return '今';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
        return `${Math.floor(diff / 86400000)}日前`;
    }
    
    // プロンプトを選択
    async function selectPrompt(promptText) {
        // 全てのカードの選択を解除
        presetCards.forEach(card => card.classList.remove('selected'));
        
        // プリセットカードを確認して選択
        let isPreset = false;
        presetCards.forEach(card => {
            if (card.getAttribute('data-prompt') === promptText) {
                card.classList.add('selected');
                isPreset = true;
            }
        });
        
        // カスタムプロンプトの場合はテキストエリアに設定
        if (!isPreset) {
            promptTextarea.value = promptText;
        } else {
            promptTextarea.value = '';
        }
        
        // 保存
        const success = await savePrompt(promptText);
        if (success) {
            showStatus('選択しました', 'success');
        }
    }
    
    // プリセットカードのクリックイベント
    presetCards.forEach(card => {
        card.addEventListener('click', async () => {
            const promptText = card.getAttribute('data-prompt');
            await selectPrompt(promptText);
        });
    });
    
    // カスタムプロンプト保存ボタンのクリックイベント
    saveButton.addEventListener('click', async () => {
        const promptText = promptTextarea.value.trim();
        
        if (!promptText) {
            showStatus('プロンプトを入力してください', 'error');
            return;
        }
        
        // 全てのプリセットカードの選択を解除
        presetCards.forEach(card => card.classList.remove('selected'));
        
        const success = await savePrompt(promptText);
        if (success) {
            showStatus('保存しました', 'success');
        } else {
            showStatus('保存に失敗しました', 'error');
        }
    });
    
    // テキストエリアの変更を監視
    promptTextarea.addEventListener('input', () => {
        // カスタムプロンプトを入力中は全てのプリセットの選択を解除
        if (promptTextarea.value.trim()) {
            presetCards.forEach(card => card.classList.remove('selected'));
        }
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
    
    // 初期化を実行
    initialize();
});