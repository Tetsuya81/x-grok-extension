// background.js - バックグラウンドスクリプト

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        // ポップアップを開く（Chrome拡張機能の制限により、直接開くことはできないため、
        // 拡張機能のアイコンクリックを促すか、オプションページを開く）
        chrome.action.openPopup().catch(() => {
            // ポップアップが開けない場合は、オプションページを開く
            chrome.runtime.openOptionsPage();
        });
    }
});