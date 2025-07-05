// X to Grok Extension - Content Script
// ポストにGrokアイコンを追加し、クリック時にリンクをコピーしてGrokページに移動

(function() {
    'use strict';
    
    // 設定
    const GROK_URL = 'https://x.com/i/grok';
    const ICON_CLASS = 'grok-icon';
    const PROCESSED_CLASS = 'grok-processed';
    
    // アイコンを作成する関数
    function createGrokIcon() {
        const icon = document.createElement('div');
        icon.className = ICON_CLASS;
        icon.title = 'Grokで分析';
        icon.setAttribute('role', 'button');
        icon.setAttribute('tabindex', '0');
        
        // アイコンのスタイルを設定
        Object.assign(icon.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #1DA1F2, #0084b4)',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            zIndex: '1000',
            transition: 'all 0.2s ease',
            opacity: '0.8',
            fontFamily: 'Arial, sans-serif'
        });
        
        icon.textContent = 'G';
        
        // ホバー効果
        icon.addEventListener('mouseenter', () => {
            icon.style.opacity = '1';
            icon.style.transform = 'scale(1.1)';
            icon.style.boxShadow = '0 2px 8px rgba(29, 161, 242, 0.3)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.opacity = '0.8';
            icon.style.transform = 'scale(1)';
            icon.style.boxShadow = 'none';
        });
        
        return icon;
    }
    
    // ポストのURLを取得する関数
    function getPostUrl(postElement) {
        try {
            // ポスト内のステータスリンクを探す
            const statusLink = postElement.querySelector('a[href*="/status/"]');
            if (statusLink) {
                return statusLink.href;
            }
            
            // 現在のページURLからポストIDを抽出（個別ポストページの場合）
            const currentUrl = window.location.href;
            if (currentUrl.includes('/status/')) {
                return currentUrl.split('?')[0]; // クエリパラメータを除去
            }
            
            return null;
        } catch (error) {
            console.error('ポストURL取得エラー:', error);
            return null;
        }
    }
    
    // クリップボードにテキストをコピーする関数
    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // フォールバック方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error('クリップボードコピーエラー:', error);
            return false;
        }
    }
    
    // アイコンクリック時の処理
    function handleIconClick(postElement, icon) {
        return async function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // ポストURLを取得
            const postUrl = getPostUrl(postElement);
            if (!postUrl) {
                console.error('ポストURLを取得できませんでした');
                return;
            }
            
            try {
                // 保存されているプロンプトを取得
                let textToCopy = postUrl;
                try {
                    const result = await chrome.storage.sync.get(['promptTemplate']);
                    if (result.promptTemplate && result.promptTemplate.trim()) {
                        // URLの後に改行とプロンプトを追加
                        textToCopy = `${postUrl}\n\n${result.promptTemplate.trim()}`;
                    }
                } catch (storageError) {
                    console.warn('プロンプト読み込みエラー:', storageError);
                    // エラーの場合はURLのみコピー
                }
                
                // クリップボードにコピー
                const copySuccess = await copyToClipboard(textToCopy);
                
                if (copySuccess) {
                    // 成功フィードバック
                    const originalText = icon.textContent;
                    icon.textContent = '✓';
                    icon.style.background = 'linear-gradient(135deg, #1DA1F2, #17bf63)';
                    
                    setTimeout(() => {
                        icon.textContent = originalText;
                        icon.style.background = 'linear-gradient(135deg, #1DA1F2, #0084b4)';
                    }, 1000);
                    
                    // Grokページに移動
                    setTimeout(() => {
                        window.open(GROK_URL, '_blank');
                    }, 500);
                } else {
                    // エラーフィードバック
                    const originalText = icon.textContent;
                    icon.textContent = '✗';
                    icon.style.background = 'linear-gradient(135deg, #e0245e, #c91e4a)';
                    
                    setTimeout(() => {
                        icon.textContent = originalText;
                        icon.style.background = 'linear-gradient(135deg, #1DA1F2, #0084b4)';
                    }, 1000);
                }
            } catch (error) {
                console.error('アイコンクリック処理エラー:', error);
            }
        };
    }
    
    // ポストにアイコンを追加する関数
    function addIconToPost(postElement) {
        // 既に処理済みの場合はスキップ
        if (postElement.classList.contains(PROCESSED_CLASS)) {
            return;
        }
        
        // ポスト要素を相対位置に設定
        if (getComputedStyle(postElement).position === 'static') {
            postElement.style.position = 'relative';
        }
        
        // アイコンを作成
        const icon = createGrokIcon();
        
        // クリックイベントを追加
        icon.addEventListener('click', handleIconClick(postElement, icon));
        
        // キーボードアクセシビリティ
        icon.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                icon.click();
            }
        });
        
        // ポストにアイコンを追加
        postElement.appendChild(icon);
        
        // 処理済みマークを追加
        postElement.classList.add(PROCESSED_CLASS);
    }
    
    // 全てのポストを処理する関数
    function processAllPosts() {
        const posts = document.querySelectorAll('[data-testid="tweet"]:not(.' + PROCESSED_CLASS + ')');
        posts.forEach(addIconToPost);
    }
    
    // DOM変更を監視する関数
    function observeChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 新しいポストが追加された場合
                            if (node.matches && node.matches('[data-testid="tweet"]')) {
                                shouldProcess = true;
                            }
                            // ポストを含む要素が追加された場合
                            if (node.querySelector && node.querySelector('[data-testid="tweet"]')) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldProcess) {
                // 少し遅延させて処理（DOM更新の完了を待つ）
                setTimeout(processAllPosts, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }
    
    // 初期化関数
    function initialize() {
        console.log('X to Grok Extension: 初期化開始');
        
        // ページ読み込み完了後に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    processAllPosts();
                    observeChanges();
                }, 1000);
            });
        } else {
            setTimeout(() => {
                processAllPosts();
                observeChanges();
            }, 1000);
        }
        
        console.log('X to Grok Extension: 初期化完了');
    }
    
    // 拡張機能を開始
    initialize();
})();

