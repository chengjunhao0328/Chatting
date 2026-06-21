/**
 * Chatting - Application Logic
 *
 * Manages state, i18n, settings persistence, API communication with
 * rAF-batched streaming, theme toggling, and message rendering.
 *
 * Built by Claude (Anthropic) for @junhaocheng
 * https://github.com/junhaocheng/chatting
 */

class Chatting {
    constructor() {
        this.state = {
            mode: 'chat',
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            apiKey: '',
            lang: 'en',
            messages: [],
            isStreaming: false,
            abortController: null,
            settingsOpen: false,
            conversations: [],
            activeConvId: null,
        };

        this.API_BASE = 'http://localhost:5001';

        // rAF render batching for streaming
        this._pendingEl = null;
        this._pendingContent = null;
        this._renderRaf = null;

        // ------------------------------------------------------------------
        // Translations
        // ------------------------------------------------------------------

        this.I18N = {
            en: {
                welcome:   { title: 'Welcome to Chatting', desc: 'Enter your API key in Settings, pick a mode, and start talking to any LLM provider.' },
                sidebar:   { modes: 'Modes', settings: 'Settings' },
                mode:      { chat: 'Chat', code: 'Code' },
                settings:  { language: 'Language', provider: 'API Provider', model: 'Model', apiKey: 'API Key', save: 'Save & Verify' },
                status:    { notConfigured: 'Not configured', verifying: 'Verifying...', connected: 'Connected', invalidKey: 'Invalid API Key', unreachable: 'Backend unreachable' },
                msg:       { you: 'You', assistant: 'Assistant', system: 'System' },
                indicator: { chat: 'Chat mode', code: 'Code mode' },
                placeholder: { chat: 'Type your message...', code: 'Describe the code you want to write...' },
                btn:       { send: 'Send', stop: 'Stop', copy: 'Copy', copied: 'Copied!' },
                error:     { noKey: 'Please configure your API Key in Settings before sending a message.', requestFailed: 'Request failed', networkError: 'Error' },
                models:    { error: 'Error loading models' },
            },

            zh: {
                welcome:   { title: '欢迎使用 Chatting', desc: '在设置中填入你的 API 密钥，选择模式，即可与各大 LLM 提供商对话。' },
                sidebar:   { modes: '模式', settings: '设置' },
                mode:      { chat: '对话', code: '代码' },
                settings:  { language: '语言', provider: 'API 提供商', model: '模型', apiKey: 'API 密钥', save: '保存并验证' },
                status:    { notConfigured: '未配置', verifying: '验证中...', connected: '已连接', invalidKey: 'API 密钥无效', unreachable: '无法连接后端' },
                msg:       { you: '你', assistant: '助手', system: '系统' },
                indicator: { chat: '对话模式', code: '代码模式' },
                placeholder: { chat: '输入你的消息...', code: '描述你想写的代码...' },
                btn:       { send: '发送', stop: '停止', copy: '复制', copied: '已复制!' },
                error:     { noKey: '请先在设置中配置 API 密钥后再发送消息。', requestFailed: '请求失败', networkError: '错误' },
                models:    { error: '加载模型列表失败' },
            },

            zh_tw: {
                welcome:   { title: '歡迎使用 Chatting', desc: '在設定中填入你的 API 金鑰，選擇模式，即可與各大 LLM 提供者對話。' },
                sidebar:   { modes: '模式', settings: '設定' },
                mode:      { chat: '對話', code: '程式碼' },
                settings:  { language: '語言', provider: 'API 提供者', model: '模型', apiKey: 'API 金鑰', save: '儲存並驗證' },
                status:    { notConfigured: '未設定', verifying: '驗證中...', connected: '已連線', invalidKey: 'API 金鑰無效', unreachable: '無法連線後端' },
                msg:       { you: '你', assistant: '助手', system: '系統' },
                indicator: { chat: '對話模式', code: '程式碼模式' },
                placeholder: { chat: '輸入你的訊息...', code: '描述你想寫的程式碼...' },
                btn:       { send: '傳送', stop: '停止', copy: '複製', copied: '已複製!' },
                error:     { noKey: '請先在設定中設定 API 金鑰後再傳送訊息。', requestFailed: '請求失敗', networkError: '錯誤' },
                models:    { error: '載入模型清單失敗' },
            },

            fr: {
                welcome:   { title: 'Bienvenue sur Chatting', desc: 'Configurez votre cle API dans les parametres, choisissez un mode et commencez a discuter avec n importe quel fournisseur LLM.' },
                sidebar:   { modes: 'Modes', settings: 'Parametres' },
                mode:      { chat: 'Discussion', code: 'Code' },
                settings:  { language: 'Langue', provider: 'Fournisseur API', model: 'Modele', apiKey: 'Cle API', save: 'Enregistrer et verifier' },
                status:    { notConfigured: 'Non configure', verifying: 'Verification...', connected: 'Connecte', invalidKey: 'Cle API invalide', unreachable: 'Serveur inaccessible' },
                msg:       { you: 'Vous', assistant: 'Assistant', system: 'Systeme' },
                indicator: { chat: 'Mode discussion', code: 'Mode code' },
                placeholder: { chat: 'Tapez votre message...', code: 'Decrivez le code a ecrire...' },
                btn:       { send: 'Envoyer', stop: 'Arreter', copy: 'Copier', copied: 'Copie !' },
                error:     { noKey: 'Veuillez configurer votre cle API dans les parametres avant denvoyer un message.', requestFailed: 'Echec de la requete', networkError: 'Erreur' },
                models:    { error: 'Erreur de chargement des modeles' },
            },

            ru: {
                welcome:   { title: 'Добро пожаловать в Chatting', desc: 'Укажите ваш API-ключ в настройках, выберите режим и начните общение с любым LLM-проваидером.' },
                sidebar:   { modes: 'Режимы', settings: 'Настройки' },
                mode:      { chat: 'Чат', code: 'Код' },
                settings:  { language: 'Язык', provider: 'API-проваидер', model: 'Модель', apiKey: 'API-ключ', save: 'Сохранить и проверить' },
                status:    { notConfigured: 'Не настроено', verifying: 'Проверка...', connected: 'Подключено', invalidKey: 'Неверный API-ключ', unreachable: 'Сервер недоступен' },
                msg:       { you: 'Вы', assistant: 'Ассистент', system: 'Система' },
                indicator: { chat: 'Режим чата', code: 'Режим кода' },
                placeholder: { chat: 'Введите сообщение...', code: 'Опишите код, которыи нужно написать...' },
                btn:       { send: 'Отправить', stop: 'Стоп', copy: 'Копировать', copied: 'Скопировано!' },
                error:     { noKey: 'Пожалуйста, укажите API-ключ в настройках перед отправкой сообщения.', requestFailed: 'Ошибка запроса', networkError: 'Ошибка' },
                models:    { error: 'Ошибка загрузки моделей' },
            },
        };

        // Non-translated static data
        this.MODEL_NAMES = {
            'claude-sonnet-4-20250514': 'Claude Sonnet 4',
            'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
            'claude-opus-4-20250514': 'Claude Opus 4',
            'claude-haiku-3-5-20241022': 'Claude 3.5 Haiku',
            'gpt-4o': 'GPT-4o',
            'gpt-4o-mini': 'GPT-4o Mini',
            'gpt-4-turbo': 'GPT-4 Turbo',
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'deepseek-chat': 'DeepSeek Chat',
            'deepseek-coder': 'DeepSeek Coder',
            'glm-4': 'GLM-4',
            'glm-4-plus': 'GLM-4 Plus',
            'glm-4-air': 'GLM-4 Air',
            'glm-4-flash': 'GLM-4 Flash',
            'MiniMax-Text-01': 'MiniMax Text-01',
            'abab6.5s-chat': 'Abab6.5s',
            'abab5.5s-chat': 'Abab5.5s',
            'doubao-pro-32k': 'Doubao Pro 32K',
            'doubao-pro-128k': 'Doubao Pro 128K',
            'doubao-lite-32k': 'Doubao Lite 32K',
            'doubao-lite-128k': 'Doubao Lite 128K',
            'qwen-max': 'Qwen Max',
            'qwen-plus': 'Qwen Plus',
            'qwen-turbo': 'Qwen Turbo',
            'qwen2.5-72b-instruct': 'Qwen2.5 72B',
            'qwen2.5-32b-instruct': 'Qwen2.5 32B',
            'qwen2.5-14b-instruct': 'Qwen2.5 14B',
            'qwen2.5-7b-instruct': 'Qwen2.5 7B',
            'gemini-2.5-flash': 'Gemini 2.5 Flash',
            'gemini-2.5-pro': 'Gemini 2.5 Pro',
            'gemini-2.0-flash': 'Gemini 2.0 Flash',
        };

        this.PROVIDER_NAMES = {
            anthropic: 'Anthropic', openai: 'OpenAI', deepseek: 'DeepSeek',
            glm: 'GLM', minimax: 'MiniMax', doubao: 'Doubao',
            qwen: 'Qwen', gemini: 'Gemini',
        };

        this.modeConfigs = {
            chat: {
                systemPrompt: 'You are a helpful AI assistant. Provide clear and concise responses.',
            },
            code: {
                systemPrompt: 'You are an expert programmer. Write clean, well-documented production-ready code. Use proper formatting and include brief comments for complex logic.',
            },
        };

        this._init();
    }

    // ----------------------------------------------------------
    // Translation helper
    // ----------------------------------------------------------

    _t(path) {
        const keys = path.split('.');
        let v = this.I18N[this.state.lang];
        for (const k of keys) { if (v && typeof v === 'object' && k in v) v = v[k]; else { v = void 0; break; } }
        if (typeof v === 'string') return v;
        v = this.I18N['en'];
        for (const k of keys) { if (v && typeof v === 'object' && k in v) v = v[k]; else return path; }
        return typeof v === 'string' ? v : path;
    }

    // ----------------------------------------------------------
    // Init
    // ----------------------------------------------------------

    _init() {
        this._cacheDOM();
        this._loadSettings();
        this._loadTheme();
        this._bindEvents();
        this._populateProviders();
        this._updateConnStatus();
        this._updateIndicators();
        this._convInit();
        setTimeout(() => this.el.input.focus(), 100);
    }

    _cacheDOM() {
        this.el = {
            app:            document.getElementById('app'),
            modeBtns:       document.querySelectorAll('.mode-btn'),
            messages:       document.getElementById('messages'),
            messagesInner:  document.getElementById('messagesInner'),
            input:          document.getElementById('input'),
            sendBtn:        document.getElementById('sendBtn'),
            settingsBtn:    document.getElementById('settingsBtn'),
            settingsPanel:  document.getElementById('settingsPanel'),
            langSel:        document.getElementById('lang'),
            provider:       document.getElementById('provider'),
            model:          document.getElementById('model'),
            apiKey:         document.getElementById('apiKey'),
            saveBtn:        document.getElementById('saveSettings'),
            connStatus:     document.getElementById('connStatus'),
            connText:       document.querySelector('.conn-text'),
            modelBadge:     document.getElementById('modelBadge'),
            modeIndicator:  document.getElementById('modeIndicator'),
            modelIndicator: document.getElementById('modelIndicator'),
            themeToggle:    document.getElementById('themeToggle'),
            convList:       document.getElementById('convList'),
            newChatBtn:     document.getElementById('newChatBtn'),
            tempChatBtn:    document.getElementById('tempChatBtn'),
        };
    }

    _bindEvents() {
        this.el.modeBtns.forEach(b => {
            b.addEventListener('click', () => this._switchMode(b.dataset.mode));
        });

        this.el.settingsBtn.addEventListener('click', () => this._toggleSettings());
        this.el.saveBtn.addEventListener('click', () => this._saveSettings());
        this.el.provider.addEventListener('change', () => this._fetchModels());
        this.el.themeToggle.addEventListener('click', () => this._toggleTheme());
        this.el.langSel.addEventListener('change', () => this._changeLanguage());
        this.el.newChatBtn.addEventListener('click', () => this._convNew());
        this.el.tempChatBtn.addEventListener('click', () => this._convNewTemp());

        this.el.sendBtn.addEventListener('click', () => {
            if (this.state.isStreaming) this._stop();
            else this._sendMessage();
        });

        this.el.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !this.state.isStreaming) { e.preventDefault(); this._sendMessage(); }
            if (e.key === 'Escape' && this.state.isStreaming) { this._stop(); }
        });

        this.el.input.addEventListener('input', () => this._autoResize());

        // Copy button delegation
        this.el.messagesInner.addEventListener('click', (e) => {
            const btn = e.target.closest('.copy-btn');
            if (!btn) return;
            const code = btn.closest('pre') && btn.closest('pre').querySelector('code');
            if (!code) return;
            const text = code.textContent;
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = this._t('btn.copied');
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = this._t('btn.copy'); btn.classList.remove('copied'); }, 2000);
            }, () => {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); btn.textContent = this._t('btn.copied'); setTimeout(() => { btn.textContent = this._t('btn.copy'); }, 2000); } catch (e) { /* */ }
                document.body.removeChild(ta);
            });
        });
    }

    // ----------------------------------------------------------
    // i18n: apply language to all UI text
    // ----------------------------------------------------------

    _applyLanguage() {
        const t = (p) => this._t(p);
        document.documentElement.setAttribute('data-lang', this.state.lang);

        // Sidebar
        const lblModes = document.getElementById('lblModes');
        if (lblModes) lblModes.textContent = t('sidebar.modes');
        const lblChats = document.getElementById('lblChats');
        if (lblChats) lblChats.textContent = 'Chats';
        this.el.settingsBtn.querySelector('span:not(.mode-icon):not(.arrow)').textContent = t('sidebar.settings');
        // Mode buttons: first text node after icon
        this.el.modeBtns.forEach(b => {
            const mode = b.dataset.mode;
            const textNode = Array.from(b.childNodes).find(n => n.nodeType === 3);
            if (textNode) textNode.textContent = ' ' + t('mode.' + mode);
        });

        // Settings labels (use label elements by id)
        const lblProvider = document.getElementById('lblProvider');
        const lblModel = document.getElementById('lblModel');
        const lblApiKey = document.getElementById('lblApiKey');
        if (lblProvider) lblProvider.textContent = t('settings.provider');
        if (lblModel) lblModel.textContent = t('settings.model');
        if (lblApiKey) lblApiKey.textContent = t('settings.apiKey');
        this.el.saveBtn.textContent = t('settings.save');

        // Mode indicator
        this._updateModeIndicator();

        // Placeholder
        this.el.input.placeholder = t('placeholder.' + this.state.mode);

        // Send button title
        this.el.sendBtn.title = this.state.isStreaming ? t('btn.stop') : t('btn.send');

        // Re-render welcome if no messages yet
        if (this.state.messages.length === 0) this._renderWelcome();

        // Re-render connection status text
        this._refreshConnText();

        // Model loading error text will be refreshed on next fetch
    }

    _refreshConnText() {
        const cs = this.el.connStatus;
        const ct = this.el.connText;
        if (cs.classList.contains('ok')) ct.textContent = this._t('status.connected');
        else if (ct.textContent !== this._t('status.verifying')) ct.textContent = this._t('status.notConfigured');
    }

    _changeLanguage() {
        this.state.lang = this.el.langSel.value;
        try {
            const s = JSON.parse(localStorage.getItem('chatting-settings') || '{}');
            s.lang = this.state.lang;
            localStorage.setItem('chatting-settings', JSON.stringify(s));
        } catch (e) { /* */ }
        this._applyLanguage();
    }

    // ----------------------------------------------------------
    // Mode
    // ----------------------------------------------------------

    _switchMode(mode) {
        if (this.state.mode === mode) return;
        this.state.mode = mode;

        this.el.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        this.el.app.className = 'app';
        if (mode === 'code') this.el.app.classList.add('mode-code');
        this.el.input.placeholder = this._t('placeholder.' + mode);
        this._updateModeIndicator();
        this.el.input.focus();
    }

    _updateModeIndicator() {
        this.el.modeIndicator.textContent = this._t('indicator.' + this.state.mode);
    }

    // ----------------------------------------------------------
    // Theme
    // ----------------------------------------------------------

    _loadTheme() {
        const saved = localStorage.getItem('chatting-theme');
        document.documentElement.setAttribute('data-theme', saved || 'dark');
    }

    _toggleTheme() {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('chatting-theme', next); } catch (e) { /* */ }
    }

    // ----------------------------------------------------------
    // Settings
    // ----------------------------------------------------------

    _toggleSettings() {
        this.state.settingsOpen = !this.state.settingsOpen;
        this.el.settingsPanel.classList.toggle('open', this.state.settingsOpen);
        this.el.settingsBtn.classList.toggle('open', this.state.settingsOpen);
    }

    _saveSettings() {
        this.state.provider = this.el.provider.value;
        this.state.model = this.el.model.value;
        this.state.apiKey = this.el.apiKey.value.trim();
        this._persistSettings();
        this._updateIndicators();
        this._updateConnStatus();
    }

    _loadSettings() {
        try {
            const saved = localStorage.getItem('chatting-settings');
            if (saved) {
                const s = JSON.parse(saved);
                this.state.provider = s.provider || 'anthropic';
                this.state.model = s.model || 'claude-sonnet-4-20250514';
                this.state.apiKey = s.apiKey || '';
                this.state.lang = s.lang || 'en';
            }
        } catch (e) { /* */ }
        this.el.apiKey.value = this.state.apiKey;
        this.el.langSel.value = this.state.lang;
    }

    _persistSettings() {
        try {
            localStorage.setItem('chatting-settings', JSON.stringify({
                provider: this.state.provider,
                model: this.state.model,
                apiKey: this.state.apiKey,
                lang: this.state.lang,
            }));
        } catch (e) { /* */ }
    }

    // ----------------------------------------------------------
    // Providers / Models
    // ----------------------------------------------------------

    async _populateProviders() {
        try {
            const resp = await fetch(this.API_BASE + '/api/providers');
            const data = await resp.json();
            this.el.provider.innerHTML = data.providers.map(p =>
                `<option value="${p.id}">${p.name}</option>`
            ).join('');
        } catch (e) {
            this.el.provider.innerHTML = `
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="deepseek">DeepSeek</option>
                <option value="glm">GLM (Zhipu)</option>
                <option value="minimax">MiniMax</option>
                <option value="doubao">Doubao (ByteDance)</option>
                <option value="qwen">Qwen (Alibaba)</option>
                <option value="gemini">Gemini (Google)</option>
            `;
        }
        this.el.provider.value = this.state.provider;
        await this._fetchModels();
    }

    async _fetchModels() {
        const provider = this.el.provider.value;
        try {
            const resp = await fetch(this.API_BASE + '/api/models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider }),
            });
            const data = await resp.json();
            this.el.model.innerHTML = data.models.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
        } catch (e) {
            this.el.model.innerHTML = `<option value="">${this._t('models.error')}</option>`;
        }
        if ([...this.el.model.options].some(o => o.value === this.state.model)) {
            this.el.model.value = this.state.model;
        }
        this._updateIndicators();
    }

    // ----------------------------------------------------------
    // Indicators
    // ----------------------------------------------------------

    _updateIndicators() {
        this.el.modelBadge.textContent = this.MODEL_NAMES[this.state.model] || this.state.model;
        const pName = this.PROVIDER_NAMES[this.state.provider] || this.state.provider;
        const mName = this.MODEL_NAMES[this.state.model] || this.state.model;
        this.el.modelIndicator.textContent = pName + ' - ' + mName;
    }

    // ----------------------------------------------------------
    // Connection Status
    // ----------------------------------------------------------

    async _updateConnStatus() {
        const cs = this.el.connStatus;
        const ct = this.el.connText;

        if (!this.state.apiKey) {
            cs.className = 'conn-status err';
            ct.textContent = this._t('status.notConfigured');
            return;
        }

        cs.className = 'conn-status err';
        ct.textContent = this._t('status.verifying');

        try {
            const resp = await fetch(this.API_BASE + '/api/verify-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: this.state.provider, api_key: this.state.apiKey }),
            });
            const data = await resp.json();
            if (data.valid) {
                cs.className = 'conn-status ok';
                ct.textContent = this._t('status.connected');
            } else {
                cs.className = 'conn-status err';
                ct.textContent = this._t('status.invalidKey');
            }
        } catch (e) {
            cs.className = 'conn-status err';
            ct.textContent = this._t('status.unreachable');
        }
    }

    // ----------------------------------------------------------
    // Messages
    // ----------------------------------------------------------

    _renderWelcome() {
        this.el.messagesInner.innerHTML =
            '<div class="welcome">' +
                '<div class="welcome-logo">' +
                    '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M4 12c0-3.3 2.7-6 6-6h12c3.3 0 6 2.7 6 6v4c0 3.3-2.7 6-6 6h-2l-6 4v-4h-4c-3.3 0-6-2.7-6-6v-4z"/>' +
                        '<path d="M11 12h10"/><path d="M11 16h6"/>' +
                    '</svg>' +
                '</div>' +
                '<h1>' + this._t('welcome.title') + '</h1>' +
                '<p>' + this._t('welcome.desc') + '</p>' +
            '</div>';
    }

    async _sendMessage() {
        const content = this.el.input.value.trim();
        if (!content || this.state.isStreaming) return;

        if (!this.state.apiKey) {
            this._addMsgElement('sys', this._t('error.noKey'));
            this._scrollBottom();
            return;
        }

        this.el.input.value = '';
        this._autoResize();

        const welcome = this.el.messagesInner.querySelector('.welcome');
        if (welcome) welcome.remove();

        this._addMsg('user', content);

        const el = this._createMsgEl('assistant');
        const body = el.querySelector('.msg-body');
        body.innerHTML = '<div class="typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
        this.el.messagesInner.appendChild(el);
        this._scrollBottom();

        this.state.isStreaming = true;
        this.el.sendBtn.classList.add('stop');
        this.el.sendBtn.title = this._t('btn.stop');
        this.el.input.disabled = true;

        this.state.abortController = new AbortController();
        let assistantContent = '';

        try {
            const system = this.modeConfigs[this.state.mode].systemPrompt;

            const resp = await fetch(this.API_BASE + '/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: this.state.provider,
                    model: this.state.model,
                    api_key: this.state.apiKey,
                    messages: this.state.messages,
                    system: system,
                    stream: true,
                }),
                signal: this.state.abortController.signal,
            });

            if (!resp.ok) {
                let errMsg = this._t('error.requestFailed') + ' (' + resp.status + ')';
                try { const d = await resp.json(); errMsg = d.error || errMsg; } catch (e) { /* */ }
                body.textContent = errMsg;
                el.classList.add('err');
                this._resetStream();
                return;
            }

            const reader = resp.body.getReader();
            const dec = new TextDecoder();
            let buf = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += dec.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop() || '';
                for (const line of lines) {
                    const t = line.trim();
                    if (t.startsWith('data: ')) {
                        const s = t.slice(6);
                        if (s === '[DONE]') continue;
                        try {
                            const d = JSON.parse(s);
                            if (d.type === 'error') {
                                body.textContent = d.message;
                                el.classList.add('err');
                                break;
                            }
                            if (d.type === 'text') {
                                assistantContent += d.content;
                                // Batched render via rAF
                                this._scheduleRender(body, assistantContent);
                            }
                        } catch (e) { /* */ }
                    }
                }
            }

            // Ensure final render
            if (assistantContent) {
                this._flushRender(body, assistantContent);
                this.state.messages.push({ role: 'assistant', content: assistantContent });
                this._convSaveCurrent();
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                if (assistantContent) {
                    this._flushRender(body, assistantContent);
                    this.state.messages.push({ role: 'assistant', content: assistantContent });
                    this._convSaveCurrent();
                }
            } else {
                body.textContent = this._t('error.networkError') + ': ' + e.message;
                el.classList.add('err');
            }
        } finally {
            this._resetStream();
        }
    }

    _stop() {
        if (this.state.abortController) this.state.abortController.abort();
    }

    _resetStream() {
        this.state.isStreaming = false;
        this.state.abortController = null;
        this.el.sendBtn.classList.remove('stop');
        this.el.sendBtn.title = this._t('btn.send');
        this.el.input.disabled = false;
        this.el.input.focus();
        this._scrollBottom();
    }

    // ----------------------------------------------------------
    // rAF-batched render for streaming
    // ----------------------------------------------------------

    _scheduleRender(el, content) {
        this._pendingEl = el;
        this._pendingContent = content;
        if (!this._renderRaf) {
            this._renderRaf = requestAnimationFrame(() => {
                if (this._pendingEl && this._pendingContent !== null) {
                    this._pendingEl.innerHTML = this._renderMD(this._pendingContent);
                    this._scrollBottom();
                }
                this._renderRaf = null;
                this._pendingEl = null;
                this._pendingContent = null;
            });
        }
    }

    _flushRender(el, content) {
        // Cancel pending rAF and render immediately
        if (this._renderRaf) {
            cancelAnimationFrame(this._renderRaf);
            this._renderRaf = null;
        }
        el.innerHTML = this._renderMD(content);
        this._renderLatex(el);  // render math after final flush
        this._scrollBottom();
        this._pendingEl = null;
        this._pendingContent = null;
    }

    // ----------------------------------------------------------
    // Render Helpers
    // ----------------------------------------------------------

    _addMsg(role, content) {
        this.state.messages.push({ role, content });
        this._addMsgElement(role, content);
        this._scrollBottom();
        this._convSaveCurrent();
    }

    _createMsgEl(role) {
        const div = document.createElement('div');
        div.className = 'msg ' + (role === 'assistant' ? '' : role);

        const name = role === 'user' ? this._t('msg.you')
                   : role === 'sys' ? this._t('msg.system')
                   : this._t('msg.assistant');

        let svg, cls;
        if (role === 'user') {
            svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>';
            cls = 'user';
        } else if (role === 'sys') {
            svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.5" fill="currentColor"/></svg>';
            cls = 'system';
        } else {
            svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M12 15v6"/><path d="M9 18h6"/></svg>';
            cls = 'assistant';
        }

        div.innerHTML =
            '<div class="msg-inner">' +
                '<div class="msg-header">' +
                    '<div class="msg-avatar ' + cls + '">' + svg + '</div>' +
                    '<span class="msg-name">' + name + '</span>' +
                '</div>' +
                '<div class="msg-body"></div>' +
            '</div>';
        return div;
    }

    _renderMD(text) {
        if (!text) return '';
        const copyLabel = this._t('btn.copy');

        // 1. Extract and protect fenced blocks (code, display math)
        const blocks = [];
        text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
            const i = blocks.length;
            blocks.push({ t: 'code', lang, code });
            return `\x00B${i}\x00`;
        });
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
            const i = blocks.length;
            blocks.push({ t: 'math', math });
            return `\x00B${i}\x00`;
        });

        // 2. Block-level processing (line by line)
        const lines = text.split('\n');
        const out = [];
        let lst = null; // active list tag

        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i];
            const L = raw.trim();

            // Restore protected block placeholder
            if (/^\x00B\d+\x00$/.test(L)) {
                if (lst) { out.push('</' + lst + '>'); lst = null; }
                const b = blocks[parseInt(L.match(/\d+/)[0])];
                if (b.t === 'code') {
                    const ll = b.lang ? '<span>' + this._esc(b.lang) + '</span>' : '<span></span>';
                    out.push('<pre><div class="code-header">' + ll + '<button class="copy-btn">' + copyLabel + '</button></div><code>' + this._esc(b.code) + '</code></pre>');
                } else {
                    out.push('<div class="math-display">' + this._esc(b.math) + '</div>');
                }
                continue;
            }

            // Blank line -> close list, paragraph break
            if (!L) { if (lst) { out.push('</' + lst + '>'); lst = null; } continue; }

            // Heading
            const hd = L.match(/^(#{1,6})\s+(.+)$/);
            if (hd) {
                if (lst) { out.push('</' + lst + '>'); lst = null; }
                out.push('<h' + hd[1].length + '>' + this._inline(hd[2]) + '</h' + hd[1].length + '>');
                continue;
            }

            // Horizontal rule
            if (/^[-*_]{3,}$/.test(L)) {
                if (lst) { out.push('</' + lst + '>'); lst = null; }
                out.push('<hr>');
                continue;
            }

            // Blockquote
            if (/^>\s/.test(L)) {
                if (lst) { out.push('</' + lst + '>'); lst = null; }
                out.push('<blockquote>' + this._inline(L.replace(/^>\s*/, '')) + '</blockquote>');
                continue;
            }

            // Unordered list
            const ul = L.match(/^[-*+]\s+(.+)$/);
            if (ul) {
                if (lst !== 'ul') { if (lst) { out.push('</' + lst + '>'); } out.push('<ul>'); lst = 'ul'; }
                out.push('<li>' + this._inline(ul[1]) + '</li>');
                continue;
            }

            // Ordered list
            const ol = L.match(/^(\d+)\.\s+(.+)$/);
            if (ol) {
                if (lst !== 'ol') { if (lst) { out.push('</' + lst + '>'); } out.push('<ol>'); lst = 'ol'; }
                out.push('<li>' + this._inline(ol[2]) + '</li>');
                continue;
            }

            // Regular paragraph
            if (lst) { out.push('</' + lst + '>'); lst = null; }
            out.push('<p>' + this._inline(L) + '</p>');
        }
        if (lst) out.push('</' + lst + '>');

        return out.join('\n');
    }

    /**
     * Process inline markdown within a block of text.
     * Order: image > link > bold > italic > strikethrough > code > inline math
     */
    _inline(text) {
        // Images ![alt](url)
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
        // Links [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        // Bold **text** or __text__
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        // Italic *text* or _text_
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
        // Strikethrough ~~text~~
        text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        // Inline code `code`
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        // Inline math $...$
        text = text.replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>');
        return text;
    }

    /**
     * Render LaTeX math via KaTeX on all math elements in the messages area.
     * Called after streaming ends or when displaying cached messages.
     */
    _renderLatex(container) {
        if (typeof katex === 'undefined') return;
        const root = container || this.el.messagesInner;
        // Display math
        root.querySelectorAll('.math-display').forEach(el => {
            if (el.dataset.rendered) return;
            try {
                el.innerHTML = katex.renderToString(el.textContent, { displayMode: true, throwOnError: false, output: 'html' });
                el.dataset.rendered = '1';
            } catch (e) { /* leave raw */ }
        });
        // Inline math
        root.querySelectorAll('.math-inline').forEach(el => {
            if (el.dataset.rendered) return;
            try {
                el.innerHTML = katex.renderToString(el.textContent, { displayMode: false, throwOnError: false, output: 'html' });
                el.dataset.rendered = '1';
            } catch (e) { /* leave raw */ }
        });
    }

    _esc(text) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(text));
        return d.innerHTML;
    }

    // ----------------------------------------------------------
    // Conversation Management
    // ----------------------------------------------------------

    _convInit() {
        this.state.conversations = [];
        this.state.activeConvId = null;
        try {
            const data = localStorage.getItem('chatting-conversations');
            if (data) this.state.conversations = JSON.parse(data);
        } catch (e) { /* */ }

        // Restore active conversation ID
        this.state.activeConvId = localStorage.getItem('chatting-active') || null;
        if (this.state.activeConvId) {
            const exists = this.state.conversations.some(c => c.id === this.state.activeConvId);
            if (!exists) this.state.activeConvId = null;
        }

        // Find most recent non-temp conversation if no active
        if (!this.state.activeConvId) {
            const recent = this.state.conversations
                .filter(c => !c.isTemporary)
                .sort((a, b) => b.updatedAt - a.updatedAt);
            if (recent.length > 0) {
                this.state.activeConvId = recent[0].id;
            }
        }

        // Create default conversation if none found
        if (!this.state.activeConvId) {
            const conv = this._convCreate(this.state.mode, false);
            this.state.activeConvId = conv.id;
        }

        // Load messages from active conversation
        this._convLoadActive();
        this._convRenderList();
        this._applyLanguage();
    }

    _convGenerateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    _convGetActive() {
        return this.state.conversations.find(c => c.id === this.state.activeConvId) || null;
    }

    _convSave(conv) {
        const idx = this.state.conversations.findIndex(c => c.id === conv.id);
        if (idx >= 0) this.state.conversations[idx] = conv;
        else this.state.conversations.push(conv);
        try {
            localStorage.setItem('chatting-conversations', JSON.stringify(this.state.conversations));
            localStorage.setItem('chatting-active', this.state.activeConvId || '');
        } catch (e) { /* quota */ }
    }

    _convCreate(mode, isTemp) {
        if (isTemp) {
            // Remove old temp conversation
            this.state.conversations = this.state.conversations.filter(c => !c.isTemporary);
        }
        const conv = {
            id: this._convGenerateId(),
            title: '',
            mode: mode || this.state.mode,
            provider: this.state.provider,
            model: this.state.model,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isTemporary: !!isTemp,
        };
        this.state.conversations.push(conv);
        this.state.activeConvId = conv.id;
        this.state.messages = [];
        this._convSave(conv);
        this._renderWelcome();
        if (!isTemp) this._convRenderList();
        return conv;
    }

    _convNew() {
        // Save current conversation first
        const cur = this._convGetActive();
        if (cur && cur.messages.length > 0) {
            cur.messages = this.state.messages;
            cur.updatedAt = Date.now();
            this._convSave(cur);
        }
        this._convCreate(this.state.mode, false);
    }

    _convNewTemp() {
        // Check if a temp conversation already exists
        const existingTemp = this.state.conversations.find(c => c.isTemporary);
        if (existingTemp) {
            // Save current messages to current conv first
            const cur = this._convGetActive();
            if (cur && !cur.isTemporary && cur.messages.length > 0) {
                cur.messages = this.state.messages;
                cur.updatedAt = Date.now();
                this._convSave(cur);
            }
            // Switch to existing temp conversation
            this.state.activeConvId = existingTemp.id;
            this.state.messages = existingTemp.messages;
            localStorage.setItem('chatting-active', existingTemp.id);
            this._renderMessages();
        } else {
            const cur = this._convGetActive();
            if (cur && !cur.isTemporary && cur.messages.length > 0) {
                cur.messages = this.state.messages;
                cur.updatedAt = Date.now();
                this._convSave(cur);
            }
            this._convCreate(this.state.mode, true);
        }
        this._convRenderList();
        this.el.tempChatBtn.classList.toggle('active', true);
    }

    _convSwitch(id) {
        if (id === this.state.activeConvId) return;

        // Save current conversation
        const cur = this._convGetActive();
        if (cur) {
            cur.messages = this.state.messages;
            cur.updatedAt = Date.now();
            this._convSave(cur);
        }

        // Switch to target
        this.state.activeConvId = id;
        localStorage.setItem('chatting-active', id);

        // Load target messages
        this._convLoadActive();
        this._convRenderList();
    }

    _convLoadActive() {
        const conv = this._convGetActive();
        if (conv) {
            this.state.messages = conv.messages || [];
            // Restore mode from conversation
            if (conv.mode) this._switchMode(conv.mode);
        } else {
            this.state.messages = [];
        }
        this._renderMessages();
    }

    _convDelete(id) {
        this.state.conversations = this.state.conversations.filter(c => c.id !== id);
        try {
            localStorage.setItem('chatting-conversations', JSON.stringify(this.state.conversations));
        } catch (e) { /* */ }
        // If we deleted the active conversation, switch to another
        if (id === this.state.activeConvId) {
            const next = this.state.conversations
                .filter(c => !c.isTemporary)
                .sort((a, b) => b.updatedAt - a.updatedAt);
            if (next.length > 0) {
                this._convSwitch(next[0].id);
            } else {
                this._convNew();
            }
        } else {
            this._convRenderList();
        }
    }

    _convSaveCurrent() {
        const cur = this._convGetActive();
        if (cur) {
            cur.messages = this.state.messages;
            cur.mode = this.state.mode;
            cur.provider = this.state.provider;
            cur.model = this.state.model;
            cur.updatedAt = Date.now();
            // Update title from first user message
            if (!cur.title) {
                const firstUser = this.state.messages.find(m => m.role === 'user');
                if (firstUser) {
                    cur.title = firstUser.content.slice(0, 50);
                    if (firstUser.content.length > 50) cur.title += '...';
                }
            }
            this._convSave(cur);
            this._convRenderList();
        }
    }

    _convRenderList() {
        const list = this.el.convList;
        if (!list) return;
        const items = this.state.conversations
            .filter(c => !c.isTemporary)
            .sort((a, b) => b.updatedAt - a.updatedAt);

        if (items.length === 0) {
            list.innerHTML = '<div class="conv-empty">No chats yet</div>';
            return;
        }

        let html = '';
        for (const conv of items) {
            const active = conv.id === this.state.activeConvId ? ' active' : '';
            const icon = conv.mode === 'code'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 7.5L4.5 12l5 4.5"/><path d="M14.5 7.5l5 4.5-5 4.5"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5c0 2.5-1.3 4.7-3.3 6a7.5 7.5 0 0 1-4.2 1.3H7l-3 2.5v-4.5C2.5 14.7 2 13 2 11.5 2 7.4 5.4 4 9.5 4h2A7.5 7.5 0 0 1 19 7.3c1.3 1.2 2 2.7 2 4.2z"/></svg>';
            const title = conv.title || 'New ' + (conv.mode === 'code' ? 'Code' : 'Chat');
            const preview = conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1].content.slice(0, 60)
                : '';
            const time = this._convFormatTime(conv.updatedAt);

            html += '<div class="conv-item' + active + '" data-id="' + conv.id + '">' +
                '<div class="conv-item-icon">' + icon + '</div>' +
                '<div class="conv-item-body">' +
                '<div class="conv-item-title">' + this._esc(title) + '</div>' +
                '<div class="conv-item-preview">' + this._esc(preview) + '</div>' +
                '</div>' +
                '<div class="conv-item-time">' + time + '</div>' +
                '</div>';
        }
        list.innerHTML = html;

        // Bind click events
        list.querySelectorAll('.conv-item').forEach(el => {
            el.addEventListener('click', () => this._convSwitch(el.dataset.id));
        });
    }

    _convFormatTime(ts) {
        const date = new Date(ts);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Yest.';
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    _renderMessages() {
        this.el.messagesInner.innerHTML = '';
        if (this.state.messages.length === 0) {
            this._renderWelcome();
        } else {
            for (const msg of this.state.messages) {
                this._addMsgElement(msg.role, msg.content);
            }
        }
        this._scrollBottom();
    }

    /**
     * Add a message element to the DOM only (no state change).
     */
    _addMsgElement(role, content) {
        const el = this._createMsgEl(role);
        const body = el.querySelector('.msg-body');
        if (role === 'user') body.textContent = content;
        else {
            body.innerHTML = this._renderMD(content);
            this._renderLatex(body);
        }
        this.el.messagesInner.appendChild(el);
    }

    // ----------------------------------------------------------
    // Utilities
    // ----------------------------------------------------------

    _autoResize() {
        const el = this.el.input;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

    _scrollBottom() {
        requestAnimationFrame(() => {
            this.el.messages.scrollTop = this.el.messages.scrollHeight;
        });
    }
}

// ----------------------------------------------------------------
// Start
// ----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    window.__app = new Chatting();
});
