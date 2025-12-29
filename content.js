// X to Grok Extension - Content Script
// ポストにGrokアイコンを追加し、クリック時にプロンプト選択モーダルを表示

(function() {
    'use strict';
    
    // 設定
    const GROK_URL = 'https://x.com/i/grok';
    const ICON_CLASS = 'grok-icon';
    const PROCESSED_CLASS = 'grok-processed';
    
    // 現在選択中のポストURL
    let currentPostUrl = '';
    
    // モーダルのスタイルを定義
    const modalStyles = `
        .grok-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .grok-modal {
            background: white;
            border: 1px solid #e1e8ed;
            border-radius: 0;
            width: 300px;
            height: 500px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            animation: slideUp 0.3s ease-out;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .grok-modal-header {
            position: relative;
            padding: 12px 16px;
            border-bottom: 1px solid #e1e8ed;
            flex-shrink: 0;
        }
        
        .grok-settings-icon {
            position: absolute;
            top: 12px;
            right: 16px;
            font-size: 16px;
            cursor: pointer;
            color: #657786;
            transition: color 0.2s;
        }
        
        .grok-settings-icon:hover {
            color: #14171a;
        }
        
        .grok-link-preview {
            width: 100%;
            height: 120px;
            background: #f7f9fa;
            border: 1px solid #e1e8ed;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
            overflow: hidden;
        }
        
        .grok-link-preview:hover {
            background: #e1e8ed;
        }
        
        .grok-link-preview-content {
            text-align: center;
            padding: 16px;
        }
        
        .grok-link-preview-title {
            font-size: 14px;
            font-weight: bold;
            color: #14171a;
            margin-bottom: 4px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .grok-link-preview-url {
            font-size: 12px;
            color: #657786;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .grok-separator {
            height: 1px;
            background: #e1e8ed;
            margin: 0;
            flex-shrink: 0;
        }
        
        .grok-template-section {
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
            border-bottom: 1px solid #e1e8ed;
        }
        
        .grok-template-label {
            font-size: 14px;
            color: #14171a;
            font-weight: 500;
        }
        
        .grok-template-combobox {
            position: relative;
            flex: 1;
        }
        
        .grok-template-input {
            width: 100%;
            padding: 8px 32px 8px 12px;
            border: 1px solid #e1e8ed;
            border-radius: 6px;
            font-size: 14px;
            color: #14171a;
            background: white;
            cursor: pointer;
            transition: all 0.2s;
            outline: none;
        }
        
        .grok-template-input:hover {
            border-color: #cbd5e0;
        }
        
        .grok-template-input:focus {
            border-color: #1DA1F2;
            box-shadow: 0 0 0 3px rgba(29, 161, 242, 0.1);
        }
        
        .grok-template-button {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 14px;
            cursor: pointer;
            padding: 4px;
            color: #657786;
            transition: color 0.2s;
        }
        
        .grok-template-button:hover {
            color: #14171a;
        }
        
        .grok-template-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e1e8ed;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
            display: none;
            margin-top: 4px;
        }
        
        .grok-template-menu.show {
            display: block;
        }
        
        .grok-template-menu-item {
            padding: 10px 12px;
            cursor: pointer;
            font-size: 14px;
            color: #14171a;
            transition: background 0.2s;
            border-bottom: 1px solid #f7f9fa;
        }
        
        .grok-template-menu-item:last-child {
            border-bottom: none;
        }
        
        .grok-template-menu-item:hover {
            background: #f7f9fa;
        }
        
        .grok-template-menu-item:focus {
            background: #e2e8f0;
            outline: none;
        }
        
        .grok-history-icon {
            background: white;
            border: 1px solid #e1e8ed;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            color: #657786;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .grok-history-icon:hover {
            background: #f7f9fa;
            color: #14171a;
            border-color: #cbd5e0;
        }
        
        .grok-modal-content {
            flex: 1;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow-y: auto;
        }
        
        .grok-prompt-form {
            flex: 1;
            border: 1px solid #e1e8ed;
            border-radius: 4px;
            padding: 12px;
            font-size: 14px;
            font-family: inherit;
            resize: none;
            outline: none;
            background: white;
            color: #14171a;
            min-height: 200px;
        }
        
        .grok-prompt-form:focus {
            border-color: #1DA1F2;
        }
        
        .grok-prompt-form::placeholder {
            color: #657786;
        }
        
        .grok-modal-footer {
            padding: 16px;
            flex-shrink: 0;
        }
        
        .grok-submit-button {
            width: 100%;
            padding: 12px 16px;
            background: #14171a;
            color: white;
            border: 1px solid #14171a;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .grok-submit-button:hover {
            background: #2f3336;
            border-color: #2f3336;
        }
        
        .grok-submit-button:disabled {
            background: #aab8c2;
            border-color: #aab8c2;
            cursor: not-allowed;
        }
        
        .grok-history-menu {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #e1e8ed;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            min-width: 250px;
            z-index: 1000;
            max-height: 200px;
            overflow-y: auto;
            display: none;
        }
        
        .grok-history-menu.show {
            display: block;
        }
        
        .grok-history-menu-item {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            color: #14171a;
            border-bottom: 1px solid #e1e8ed;
            transition: background 0.2s;
        }
        
        .grok-history-menu-item:last-child {
            border-bottom: none;
        }
        
        .grok-history-menu-item:hover {
            background: #f7f9fa;
        }
        
        .grok-history-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `;
    
    // デフォルトプリセットプロンプト
    const DEFAULT_PRESETS = [
        { text: 'この投稿を要約してください' },
        { text: 'この投稿を日本語に翻訳してください' },
        { text: 'この投稿の内容を分析してください' },
        { text: 'この投稿について詳しく説明してください' }
    ];
    
    let presetPrompts = [...DEFAULT_PRESETS];
    
    // カスタムプリセットを読み込み
    async function loadCustomPresets() {
        try {
            const result = await chrome.storage.sync.get(['customPresets']);
            if (result.customPresets && result.customPresets.length > 0) {
                presetPrompts = result.customPresets;
            }
        } catch (error) {
            console.error('カスタムプリセット読み込みエラー:', error);
        }
    }
    
    // モーダルスタイルを注入
    function injectModalStyles() {
        if (document.getElementById('grok-modal-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'grok-modal-styles';
        styleElement.textContent = modalStyles;
        document.head.appendChild(styleElement);
    }
    
    // モーダルを作成
    async function createModal() {
        // カスタムプリセットを読み込み
        await loadCustomPresets();
        const overlay = document.createElement('div');
        overlay.className = 'grok-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'grok-modal';
        
        // ヘッダー（Settings アイコンとLink Preview）
        const header = document.createElement('div');
        header.className = 'grok-modal-header';
        
        // Settings アイコン
        const settingsIcon = document.createElement('div');
        settingsIcon.className = 'grok-settings-icon';
        settingsIcon.innerHTML = '⚙️';
        settingsIcon.title = 'プラグイン設定を開く';
        settingsIcon.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openPopup' });
            closeModal(overlay);
        });
        header.appendChild(settingsIcon);
        
        // Link Preview
        const linkPreview = document.createElement('div');
        linkPreview.className = 'grok-link-preview';
        
        const linkContent = document.createElement('div');
        linkContent.className = 'grok-link-preview-content';
        
        const linkTitle = document.createElement('div');
        linkTitle.className = 'grok-link-preview-title';
        linkTitle.textContent = getPostTitle();
        
        const linkUrl = document.createElement('div');
        linkUrl.className = 'grok-link-preview-url';
        linkUrl.textContent = currentPostUrl;
        
        linkContent.appendChild(linkTitle);
        linkContent.appendChild(linkUrl);
        linkPreview.appendChild(linkContent);
        
        // リンクプレビューをクリックで新しいタブで開く
        linkPreview.addEventListener('click', () => {
            window.open(currentPostUrl, '_blank');
        });
        
        header.appendChild(linkPreview);
        
        // 区切り線①
        const separator1 = document.createElement('div');
        separator1.className = 'grok-separator';
        
        // Template Prompt セクション
        const templateSection = document.createElement('div');
        templateSection.className = 'grok-template-section';
        
        // Template Combobox
        const templateCombobox = document.createElement('div');
        templateCombobox.className = 'grok-template-combobox';
        
        const templateInput = document.createElement('input');
        templateInput.className = 'grok-template-input';
        templateInput.type = 'text';
        templateInput.placeholder = 'テンプレートから選択';
        templateInput.readOnly = true;
        
        const templateButton = document.createElement('button');
        templateButton.className = 'grok-template-button';
        templateButton.innerHTML = '∨';
        templateButton.type = 'button';
        
        const templateMenu = document.createElement('div');
        templateMenu.className = 'grok-template-menu';
        
        // プリセットプロンプトをメニューに追加
        presetPrompts.forEach(prompt => {
            const menuItem = document.createElement('div');
            menuItem.className = 'grok-template-menu-item';
            menuItem.textContent = prompt.text;
            menuItem.setAttribute('tabindex', '0');
            menuItem.addEventListener('click', () => {
                templateInput.value = prompt.text;
                setPromptInForm(prompt.text);
                templateMenu.classList.remove('show');
                templateButton.innerHTML = '∨';
            });
            templateMenu.appendChild(menuItem);
        });
        
        templateCombobox.appendChild(templateInput);
        templateCombobox.appendChild(templateButton);
        templateCombobox.appendChild(templateMenu);
        
        // History アイコン
        const historyIcon = document.createElement('button');
        historyIcon.className = 'grok-history-icon';
        historyIcon.innerHTML = '⟲';
        historyIcon.title = '過去の入力履歴を呼び出し';
        
        const historyMenu = document.createElement('div');
        historyMenu.className = 'grok-history-menu';
        
        // 履歴メニューの位置調整のためのコンテナ
        const historyContainer = document.createElement('div');
        historyContainer.style.position = 'relative';
        historyContainer.appendChild(historyIcon);
        historyContainer.appendChild(historyMenu);
        
        templateSection.appendChild(templateCombobox);
        templateSection.appendChild(historyContainer);
        
        // 区切り線②
        const separator2 = document.createElement('div');
        separator2.className = 'grok-separator';
        
        // Prompt Form コンテンツ
        const content = document.createElement('div');
        content.className = 'grok-modal-content';
        
        const promptForm = document.createElement('textarea');
        promptForm.className = 'grok-prompt-form';
        promptForm.placeholder = 'Prompt form';
        
        content.appendChild(promptForm);
        
        // フッター（実行ボタン）
        const footer = document.createElement('div');
        footer.className = 'grok-modal-footer';
        
        const submitButton = document.createElement('button');
        submitButton.className = 'grok-submit-button';
        submitButton.textContent = 'Go to Grok';
        
        footer.appendChild(submitButton);
        
        // イベントリスナー
        
        // Template Comboboxのイベント
        const toggleTemplateMenu = (e) => {
            e.stopPropagation();
            const isOpen = templateMenu.classList.contains('show');
            templateMenu.classList.toggle('show');
            templateButton.innerHTML = isOpen ? '∨' : '∧';
        };
        
        templateButton.addEventListener('click', toggleTemplateMenu);
        templateInput.addEventListener('click', toggleTemplateMenu);
        
        // History アイコンクリック
        historyIcon.addEventListener('click', async (e) => {
            e.stopPropagation();
            await loadHistoryMenu(historyMenu);
            const isOpen = historyMenu.classList.contains('show');
            historyMenu.classList.toggle('show');
        });
        
        // 実行ボタンクリック処理を関数化
        const handleSubmit = () => {
            const promptText = promptForm.value.trim() || '投稿を分析してください';
            handlePromptSelection(promptText);
            closeModal(overlay);
        };
        
        // 実行ボタンクリック
        submitButton.addEventListener('click', handleSubmit);
        
        // プロンプトフォームに設定する関数をグローバルに保存
        window.grokSetPromptInForm = (text) => {
            promptForm.value = text;
        };
        
        // モーダルを組み立て
        modal.appendChild(header);
        modal.appendChild(separator1);
        modal.appendChild(templateSection);
        modal.appendChild(separator2);
        modal.appendChild(content);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        
        // オーバーレイクリックで閉じる
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
        
        // ドキュメントクリックでメニューを閉じる
        document.addEventListener('click', () => {
            templateMenu.classList.remove('show');
            historyMenu.classList.remove('show');
            templateButton.innerHTML = '∨';
        });
        
        // キーボードショートカット処理
        const handleKeyboard = (e) => {
            // ESCキーで閉じる
            if (e.key === 'Escape') {
                closeModal(overlay);
                document.removeEventListener('keydown', handleKeyboard);
                return;
            }
            
            // Command/Ctrl + Shift + Enter (Return) で実行
            // Mac: Command (metaKey) + Shift + Enter
            // Windows/Linux: Ctrl (ctrlKey) + Shift + Enter
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifierKey = isMac ? e.metaKey : e.ctrlKey;
            
            if (modifierKey && e.shiftKey && (e.key === 'Enter' || e.key === 'Return')) {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
                document.removeEventListener('keydown', handleKeyboard);
            }
        };
        document.addEventListener('keydown', handleKeyboard);
        
        // 初期プロンプトを読み込み
        loadInitialPrompt(promptForm, templateInput);
        
        return overlay;
    }
    
    // プロンプトフォームに値を設定
    function setPromptInForm(text) {
        if (window.grokSetPromptInForm) {
            window.grokSetPromptInForm(text);
        }
    }
    
    // ポストのタイトルを取得
    function getPostTitle() {
        try {
            // ポストのテキストコンテンツを取得
            const postElement = document.querySelector(`[data-testid="tweet"]:has(.${ICON_CLASS})`);
            if (postElement) {
                const textElement = postElement.querySelector('[data-testid="tweetText"]');
                if (textElement) {
                    const text = textElement.textContent.trim();
                    return text.length > 50 ? text.substring(0, 47) + '...' : text;
                }
            }
            return 'X投稿';
        } catch (error) {
            return 'X投稿';
        }
    }
    
    // 初期プロンプトを読み込み
    async function loadInitialPrompt(promptForm, templateInput) {
        try {
            const result = await chrome.storage.sync.get(['promptTemplate']);
            if (result.promptTemplate) {
                promptForm.value = result.promptTemplate;
                if (templateInput) {
                    // プリセットプロンプトと一致するかチェック
                    const matchingPreset = presetPrompts.find(p => p.text === result.promptTemplate);
                    if (matchingPreset) {
                        templateInput.value = matchingPreset.text;
                    } else {
                        templateInput.placeholder = 'カスタムプロンプト使用中';
                    }
                }
            }
        } catch (error) {
            console.error('初期プロンプト読み込みエラー:', error);
        }
    }
    
    // 履歴メニューを読み込み
    async function loadHistoryMenu(historyMenu) {
        try {
            const result = await chrome.storage.sync.get(['promptHistory']);
            historyMenu.innerHTML = '';
            
            if (result.promptHistory && result.promptHistory.length > 0) {
                result.promptHistory.forEach(item => {
                    const menuItem = document.createElement('div');
                    menuItem.className = 'grok-history-menu-item';
                    
                    const text = document.createElement('div');
                    text.className = 'grok-history-text';
                    text.textContent = item.text;
                    
                    menuItem.appendChild(text);
                    
                    menuItem.addEventListener('click', () => {
                        setPromptInForm(item.text);
                        historyMenu.classList.remove('show');
                    });
                    
                    historyMenu.appendChild(menuItem);
                });
            } else {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'grok-history-menu-item';
                emptyItem.style.color = '#657786';
                emptyItem.textContent = '履歴がありません';
                historyMenu.appendChild(emptyItem);
            }
        } catch (error) {
            console.error('履歴読み込みエラー:', error);
        }
    }
    
    
    // モーダルを閉じる
    function closeModal(overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        overlay.querySelector('.grok-modal').style.animation = 'slideDown 0.2s ease-out';
        setTimeout(() => {
            overlay.remove();
        }, 200);
    }
    
    // プロンプト選択時の処理
    async function handlePromptSelection(promptText) {
        try {
            // プロンプトを保存
            await chrome.storage.sync.set({ promptTemplate: promptText });
            
            // 履歴を更新
            const result = await chrome.storage.sync.get(['promptHistory']);
            let history = result.promptHistory || [];
            
            // 重複を除去して先頭に追加
            history = history.filter(item => item.text !== promptText);
            history.unshift({ text: promptText, timestamp: Date.now() });
            
            // 最大5件に制限
            if (history.length > 5) {
                history = history.slice(0, 5);
            }
            
            await chrome.storage.sync.set({ promptHistory: history });
            
            // URLとプロンプトをコピーしてGrokページへ移動
            const textToCopy = `${currentPostUrl}\n\n${promptText}`;
            const copySuccess = await copyToClipboard(textToCopy);
            
            if (copySuccess) {
                // 成功フィードバック（必要に応じて）
                setTimeout(() => {
                    window.open(GROK_URL, '_blank');
                }, 100);
            }
        } catch (error) {
            console.error('プロンプト選択エラー:', error);
        }
    }
    
    // アイコンを作成する関数
    function createGrokIcon() {
        const icon = document.createElement('span');
        icon.className = ICON_CLASS;
        icon.title = 'Grokで分析';
        icon.setAttribute('role', 'button');
        icon.setAttribute('tabindex', '0');
        icon.textContent = 'G';

        // スタイルはCSSファイル（styles.css）で定義
        // インラインスタイルは最小限に（CSSで定義できない場合のみ）

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
            
            // URLを保存
            currentPostUrl = postUrl;
            
            // モーダルを表示
            injectModalStyles();
            const modal = await createModal();
            document.body.appendChild(modal);
        };
    }
    
    // ポストにアイコンを追加する関数
    function addIconToPost(postElement) {
        // 既に処理済みの場合はスキップ
        if (postElement.classList.contains(PROCESSED_CLASS)) {
            return;
        }

        // 既にアイコンが存在する場合もスキップ（重複防止）
        if (postElement.querySelector('.' + ICON_CLASS)) {
            postElement.classList.add(PROCESSED_CLASS);
            return;
        }

        // 処理済みマークを先に追加（重複防止を強化）
        postElement.classList.add(PROCESSED_CLASS);

        // time要素を探す
        const timeElement = postElement.querySelector('time[datetime]');

        if (timeElement) {
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

            // time要素が含まれるdivブロック（親要素）の右隣に挿入
            const parentElement = timeElement.parentNode;
            if (parentElement && parentElement.parentNode) {
                // 親要素の直後にアイコンを挿入
                parentElement.parentNode.insertBefore(icon, parentElement.nextSibling);
            } else if (parentElement) {
                // フォールバック: 親要素が見つからない場合は従来の方法
                parentElement.insertBefore(icon, timeElement.nextSibling);
            }
        } else {
            // time要素が見つからない場合は従来の方法（絶対配置）
            // ポスト要素を相対位置に設定
            if (getComputedStyle(postElement).position === 'static') {
                postElement.style.position = 'relative';
            }

            const icon = createGrokIcon();

            // 絶対配置用のスタイルを上書き
            Object.assign(icon.style, {
                position: 'absolute',
                top: '8px',
                right: '40px',
                display: 'flex'
            });

            // クリックイベントを追加
            icon.addEventListener('click', handleIconClick(postElement, icon));

            // キーボードアクセシビリティ
            icon.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    icon.click();
                }
            });

            postElement.appendChild(icon);
        }
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