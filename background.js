// background.js - バックグラウンドスクリプト

// 拡張機能アイコンクリックで設定画面を開く
chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        // 設定画面を開く
        chrome.runtime.openOptionsPage();
    }
});