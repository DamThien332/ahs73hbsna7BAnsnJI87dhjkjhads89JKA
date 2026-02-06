// ==UserScript==
// @name         Berserk Mod (LBS)
// @namespace    http://tampermonkey.net/
// @version      0.139b
// @description  BerserK Mod Feitor por Dragon, use com  moderacao :)
// @author       Dragon e Canada
// @match        https://littlebigsnake.com/
// @icon         https://cdn.discordapp.com/icons/1432165371485487157/83e06932dd92e7ac6734ec4c1391f9f8.png?size=2048
// @require      https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Configurações de Webhook
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1461958848184188952/EmSIXbCfpt2SNM7TFP7kArnGBwtY5GClTRa7ioXU2iVH6U6BuxGxUbMpN115KzDYmpPK';

    // Credenciais válidas
    const VALID_CREDENTIALS = {
        username: 'bskmod',
        password: 'update'
    };

    const EXPIRATION_DATE = new Date('2026-02-25T23:59:59');

    function getTodayBR() {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    // Variáveis para tracking
    let loginStartTime = null;
    let currentUserData = null;
    let usageInterval = null;
    let userAccountId = null;
    let userNickname = null;

    // ========== FUNÇÕES DE WEBHOOK ==========

    // Enviar webhook para Discord
    async function sendWebhook(embedData, type = 'login') {
        try {
            const payload = {
                embeds: [{
                    title: embedData.title || 'Berserk Mod Log',
                    description: embedData.description || '',
                    color: embedData.color || 0x00ff00,
                    fields: embedData.fields || [],
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: `Berserk Mod v4 • ${type === 'login' ? 'Login System' : 'Game Tracking'}`
                    }
                }],
                username: 'Berserk Mod Logger',
                avatar_url: 'https://cdn.discordapp.com/icons/1432165371485487157/83e06932dd92e7ac6734ec4c1391f9f8.png?size=128'
            };

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error('Erro ao enviar webhook:', error);
        }
    }

    // Log de tentativa de login
    function logLoginAttempt(username, success) {
        const embed = {
            title: success ? '✅ Login Bem-sucedido' : '❌ Tentativa de Login Falhou',
            color: success ? 0x00ff00 : 0xff0000,
            fields: [
                {
                    name: '👤 Username',
                    value: `\`${username || 'N/A'}\``,
                    inline: true
                },
                {
                    name: '📅 Data/Hora',
                    value: new Date().toLocaleString('pt-BR'),
                    inline: true
                }
            ]
        };

        if (!success) {
            embed.fields.push({
                name: '⚠️ Aviso',
                value: 'Tentativa de acesso com credenciais inválidas',
                inline: false
            });
        }

        sendWebhook(embed, 'login');
    }

    // Log de início de uso do mod
    function logModUsageStart() {
        if (!userAccountId || !userNickname) {
            console.log('[WEBHOOK] Dados do usuário ainda não disponíveis');
            return;
        }

        loginStartTime = Date.now();
        currentUserData = {
            accountId: userAccountId,
            name: userNickname
        };

        const embed = {
            title: '🎮 Mod em Uso',
            color: 0x7289da,
            fields: [
                {
                    name: '🆔 Account ID',
                    value: `\`#${userAccountId}\``,
                    inline: true
                },
                {
                    name: '🏷️ Nickname',
                    value: `\`${userNickname}\``,
                    inline: true
                },
                {
                    name: '⏰ Início',
                    value: new Date().toLocaleTimeString('pt-BR'),
                    inline: true
                }
            ],
            description: 'Usuário iniciou o Berserk Mod no jogo'
        };

        sendWebhook(embed, 'usage');

        // Iniciar intervalo para enviar atualizações periódicas
        if (usageInterval) clearInterval(usageInterval);
        usageInterval = setInterval(sendUsageUpdate, 300000); // A cada 5 minutos
    }

    // Log de atualização de uso
    function sendUsageUpdate() {
        if (!currentUserData || !loginStartTime) return;

        const currentTime = Date.now();
        const minutesUsed = Math.floor((currentTime - loginStartTime) / 60000);

        const embed = {
            title: '⏱️ Mod em Uso - Atualização',
            color: 0xf1c40f,
            fields: [
                {
                    name: '🏷️ Nickname',
                    value: `\`${currentUserData.name}\``,
                    inline: true
                },
                {
                    name: '⏰ Tempo de Uso',
                    value: `${minutesUsed} minutos`,
                    inline: true
                },
                {
                    name: '🆔 Account ID',
                    value: `\`#${currentUserData.accountId}\``,
                    inline: true
                },
                {
                    name: '📊 Status',
                    value: 'Mod ainda em execução',
                    inline: false
                }
            ]
        };

        sendWebhook(embed, 'usage');
    }

    // Função para extrair dados do usuário do pacote 106
    function extractUserDataFromPacket106(accountdata) {
        try {
            if (!accountdata || accountdata.length < 50) {
                console.log('[WEBHOOK] Dados muito curtos:', accountdata?.length);
                return null;
            }

            // Classe Reader simplificada
            class PacketReader {
                constructor(data) {
                    this.data = data;
                    this.offset = 0;
                }

                int8() {
                    if (this.offset >= this.data.length) return 0;
                    return this.data[this.offset++];
                }

                int16() {
                    if (this.offset + 1 >= this.data.length) return 0;
                    const val = (this.data[this.offset] << 8) | this.data[this.offset + 1];
                    this.offset += 2;
                    return val;
                }

                int32() {
                    if (this.offset + 3 >= this.data.length) return 0;
                    const val = (this.data[this.offset] << 24) |
                                (this.data[this.offset + 1] << 16) |
                                (this.data[this.offset + 2] << 8) |
                                this.data[this.offset + 3];
                    this.offset += 4;
                    return val;
                }

                getString() {
                    const length = this.int16();
                    if (length <= 0 || this.offset + length > this.data.length) {
                        this.offset += Math.max(0, length);
                        return '';
                    }

                    try {
                        const bytes = this.data.slice(this.offset, this.offset + length);
                        let str = '';
                        for (let i = 0; i < bytes.length; i++) {
                            const b = bytes[i];
                            if (b === 0) break;
                            if (b >= 32 && b <= 126) {
                                str += String.fromCharCode(b);
                            }
                        }
                        this.offset += length;
                        return str || 'Unknown';
                    } catch (e) {
                        this.offset += length;
                        return 'Unknown';
                    }
                }

                skip(count) {
                    this.offset = Math.min(this.data.length, this.offset + count);
                }
            }

            const reader = new PacketReader(accountdata);
            const packetLength = reader.int16();
            const tipo = reader.int8();

            if (tipo !== 106) return null;

            reader.int8(); // lastType
            const nickname = reader.getString();

            // Pular campos até chegar no rating (usado como accountId)
            reader.skip(36); // level(2) + skin_id(1) + flag_id(1) + experience(4) + gold(4) + diamonds(4) + chest_crowns(1) + rating(4) + rankIndex(1) + priceRegion(1) + subscription(1) + had_trial(1) + newbie(1) + registered(1) + tester(1) + first_login(1) + buffs(1) + cards(1) + everPlayedJuja(1) + chestTrack(1) + chestProgress(1) + x(2)
            const rating = reader.int32(); // Rating (usado como accountId temporariamente)

            let cleanNickname = nickname.replace(/[^\x20-\x7E]/g, '').trim();
            if (!cleanNickname || cleanNickname.length < 2) {
                cleanNickname = 'UnknownPlayer';
            }

            return {
                nickname: cleanNickname,
                accountId: rating
            };
        } catch (error) {
            console.error('[WEBHOOK] Erro ao extrair dados do pacote 106:', error);
            return null;
        }
    }

    // ========== FUNÇÕES EXISTENTES ==========

    function isAlreadyLoggedIn() {
        try {
            const data = JSON.parse(localStorage.getItem('BsK_mod11'));
            if (!data) return false;
            if (new Date() > new Date(data.expiresAt)) {
                localStorage.removeItem('BsK_mod11');
                return false;
            }
            return data.loggedIn === true;
        } catch {
            return false;
        }
    }

    function saveLogin() {
        localStorage.setItem('BsK_mod1', JSON.stringify({
            loggedIn: true,
            expiresAt: EXPIRATION_DATE.toISOString()
        }));
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed;
            inset:0;
            background:linear-gradient(135deg,rgba(150,120,255,.45),rgba(80,140,255,.35));
            z-index:999999;
            display:flex;
            align-items:center;
            justify-content:center;
        `;
        return overlay;
    }

    function createLoginModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            width:420px;
            padding:42px;
            border-radius:28px;
            background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,.18));
            backdrop-filter:blur(32px);
            border:1px solid rgba(255,255,255,.35);
            box-shadow:
                inset 0 0 0 1px rgba(255,255,255,.25),
                0 35px 80px rgba(0,0,0,.45);
            animation:pop .45s ease;
            color:white;
            font-family:Inter,Arial,sans-serif;
        `;

        modal.innerHTML = `
            <h2 class="title">Login</h2>
            <div id="login-error" class="error"></div>

            <div class="field">
                <i data-lucide="mail"></i>
                <input id="login-username" placeholder="Email">
            </div>

            <div class="field">
                <i data-lucide="lock"></i>
                <input id="login-password" type="password" placeholder="Password">
            </div>

            <div class="row">
                <div class="toggle-wrap">
                    <span>Remember Me</span>
                    <label class="toggle">
                        <input type="checkbox" id="remember-me">
                        <span class="slider"></span>
                    </label>
                </div>
                <a href="#" id="forgot-password">Forgot Password?</a>
            </div>

            <button id="login-button">Log in</button>

            <div class="footer">
                Don't have an account?
                <a href="#" id="register-link">Register</a>
            </div>
        `;
        return modal;
    }

    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pop {
                from {opacity:0;transform:scale(.94)}
                to {opacity:1;transform:scale(1)}
            }

            @keyframes shake {
                0% {transform:translateX(0)}
                25% {transform:translateX(-4px)}
                50% {transform:translateX(4px)}
                75% {transform:translateX(-3px)}
                100% {transform:translateX(0)}
            }

            .title {
                text-align:center;
                margin-bottom:26px;
                font-weight:600;
                position:relative;
            }

            .title::after {
                content:"";
                display:block;
                width:46px;
                height:2px;
                margin:14px auto 0;
                border-radius:2px;
                background:rgba(255,255,255,.6);
            }

            .error {
                display:none;
                text-align:center;
                margin-bottom:18px;
                font-size:14px;
                opacity:.9;
            }

            .error.error-msg {
                color:#ffb3b3;
            }

            .error.info-msg {
                color:#e8f6ff;
            }

            .error.show {
                display:block;
                animation:shake .3s ease;
            }

            .field {
                display:flex;
                gap:12px;
                border-bottom:1px solid rgba(255,255,255,.55);
                padding-bottom:10px;
                margin-bottom:24px;
                transition:.25s;
            }

            .field input {
                flex:1;
                background:transparent;
                border:none;
                color:white;
                font-size:15px;
                outline:none;
            }

            .field:focus-within {
                border-color:#fff;
                box-shadow:0 8px 22px rgba(255,255,255,.15);
            }

            .row {
                display:flex;
                justify-content:space-between;
                align-items:center;
                font-size:13px;
                opacity:.85;
            }

            .row a {
                color:#e8f6ff;
                text-decoration:none;
                cursor:pointer;
            }

            .row a:hover {
                text-decoration:underline;
            }

            .toggle-wrap {
                display:flex;
                align-items:center;
                gap:10px;
            }

            .toggle {
                position:relative;
                width:42px;
                height:22px;
            }

            .toggle input {
                display:none;
            }

            .slider {
                position:absolute;
                inset:0;
                background:rgba(255,255,255,.35);
                border-radius:22px;
                backdrop-filter:blur(6px);
                transition:.25s;
            }

            .slider:before {
                content:"";
                position:absolute;
                width:18px;
                height:18px;
                left:2px;
                top:2px;
                background:white;
                border-radius:50%;
                transition:.25s;
            }

            .toggle input:checked + .slider {
                background:linear-gradient(135deg,#7aa7ff,#a8c8ff);
            }

            .toggle input:checked + .slider:before {
                transform:translateX(20px);
            }

            #login-button {
                width:100%;
                margin-top:18px;
                padding:15px;
                border-radius:18px;
                border:1px solid rgba(255,255,255,.45);
                background:rgba(255,255,255,.25);
                backdrop-filter:blur(12px);
                color:white;
                font-size:15px;
                font-weight:600;
                cursor:pointer;
                box-shadow:0 14px 34px rgba(0,0,0,.3);
                transition:.25s;
            }

            #login-button:hover {
                background:rgba(255,255,255,.38);
                transform:translateY(-1px) scale(1.01);
            }

            #login-button:active {
                transform:translateY(1px) scale(.99);
                box-shadow:0 8px 18px rgba(0,0,0,.35);
            }

            .footer {
                text-align:center;
                margin-top:24px;
                font-size:13px;
                opacity:.75;
            }

            .footer a {
                color:white;
                text-decoration:underline;
                cursor:pointer;
            }
        `;
        document.head.appendChild(style);
    }

    function loadLucide() {
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.js';
        s.onload = () => lucide.createIcons();
        document.head.appendChild(s);
    }

    function showLogin() {
        const overlay = createOverlay();
        const modal = createLoginModal();
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const u = modal.querySelector('#login-username');
        const p = modal.querySelector('#login-password');
        const r = modal.querySelector('#remember-me');
        const e = modal.querySelector('#login-error');

        function showMessage(msg, type = 'info') {
            e.textContent = msg;
            e.className = `error ${type}-msg`;
            e.classList.remove('show');
            void e.offsetWidth;
            e.classList.add('show');
        }

        function login() {
            const username = u.value;
            const password = p.value;

            if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
                if (new Date() > EXPIRATION_DATE) {
                    showMessage('Trial expired. Contact support.', 'error');
                    logLoginAttempt(username, false);
                    return;
                }

                logLoginAttempt(username, true);

                if (r.checked) saveLogin();
                document.body.style.overflow = '';
                overlay.remove();
                startBerserkMod();
            } else {
                logLoginAttempt(username, false);
                showMessage('Invalid credentials', 'error');
                p.value = '';
            }
        }

        modal.querySelector('#login-button').onclick = login;
        modal.querySelector('#forgot-password').onclick = ev => {
            ev.preventDefault();
            showMessage('Password recovery is not available. Contact the mod administrator.', 'info');
        };

        modal.querySelector('#register-link').onclick = ev => {
            ev.preventDefault();
            showMessage('Registration is currently closed. Request access from the mod owner.', 'info');
        };

        modal.tabIndex = -1;
        modal.focus();
        modal.addEventListener('keydown', ev => ev.key === 'Enter' && login());

        u.focus();
        loadLucide();
    }

    function startBerserkMod() {
        const UNITY = () => window.UnityBridge?.unityInstance?.Module;
        console.log('[LBS] Script injetado');

        window.index = 0;
        let ctx, serverinfo = '';
        let topplayers = [];
        window.ctx = ctx;

        // Hook para inicializar nosso canvas
        APP.onClientReady = new Proxy(APP.onClientReady, {
            apply(target, thisArg, args) {
                console.log('[LBS] APP.onClientReady disparado');
                setCanvas();
                return target.apply(thisArg, args);
            }
        });

        function getTextColor(flags) {
            switch (flags) {
                case 1: return '#7FFF00';
                case 2: return '#FFD700';
                case 4:
                case 5: return '#FF00FF';
                default: return 'white';
            }
        }

        function drawCanvas2(){
            ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = "18pt Arial";
            const text_info = ctx.measureText(serverinfo);
            const height = ctx.font.match(/\d+/).pop() || 10;
            const width = text_info.width
            ctx.fillStyle ="rgba(0, 0, 0, 0.5)"
            ctx.fillRect(20, 200, width, height)
            ctx.fillStyle ='white';
            ctx.textBaseline = "top";
            ctx.textAlign = "start";
            ctx.fillText(serverinfo, 20, 200);

            ctx.font = "14pt Arial";
            var x = 20
            var y = 250
            var lineheight = 25;
            ctx.fillStyle ='white';
            for (var i = 0; i<topplayers.length; i++){
                ctx.textAlign = "left";
                ctx.fillStyle = getTextColor(topplayers[i].flags)
                ctx.fillText(topplayers[i].place, x, y + (i*lineheight));

                ctx.textAlign = "start";

                ctx.fillText(topplayers[i].name, x + 40, y + (i*lineheight));
                ctx.fillText(topplayers[i].accountId.toLocaleString(), x + 200, y + (i*lineheight));
                ctx.fillText(topplayers[i].id, x + 350, y + (i*lineheight));
            }

            requestAnimationFrame(drawCanvas2)
        }

        const setCanvas = ()=>{
            var canvas = document.createElement('canvas')
            const _width = 900
            let _heigth = 900
            canvas.id = 'canvas2'
            canvas.style = 'width: 100%; height: 100%;position:relative; display:none;  top: 0;left: 0;position: absolute;z-index:0;  pointer-events: none;'
            var gamecanvas =document.getElementById('canvas')
            gamecanvas.style.zIndex=1000
            ctx = canvas.getContext('2d')
            ctx.canvas.width  = window.innerWidth
            ctx.canvas.height = window.innerHeight
            gamecanvas.parentElement.appendChild(canvas)
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth
                canvas.height = window.innerHeight
            })
            requestAnimationFrame(drawCanvas2)
        }

        const wsinstances = { master: {}, chat: {}, game: {} }
        const onbinary = 5670
        let mypos = {x:0, y:0}

        const processCopy = (array)=>{
            worker.postMessage({ byteArray: array }, [array])
        }

        WebSocket = new Proxy(WebSocket, {
            construct: (target, args) => {
                var _url = args[0].replace('8080', '8443')
                args[0] = _url
                let instance = new target(...args)

                switch (_url) {
                    case 'wss://master.littlebigsnake.com:8443/':
                        wsinstances.master = instance
                        break
                    case 'wss://littlebigsnake.com:8443/':
                        wsinstances.chat = instance
                        break
                    default:
                        wsinstances.game = instance
                }

                instance = new Proxy(instance, {
                    set: (target, key, value, receiver) => {
                        if(key == 'onclose'){
                            value = new Proxy(value,{
                                apply:(target, thisArg, argumentlist, receiver)=>{
                                    if(thisArg.url == wsinstances.game.url){
                                        serverinfo=''
                                        topplayers=[]
                                    }
                                    return target.apply(thisArg, argumentlist)
                                }
                            })
                        }

                        if(key == 'onmessage'){
                            value = new Proxy(value,{
                                apply:(target, thisArg, argumentlist, receiver)=>{
                                    target.apply(thisArg, argumentlist)
                                    if(argumentlist[0].data instanceof ArrayBuffer){
                                        processCopy(argumentlist[0].data)
                                    }
                                    return true
                                }
                            })
                        }
                        target[key] = value
                        return true
                    },
                    get: (target, key) => {
                        return typeof target[key] == "function" ? target[key].bind(target) : target[key];
                    },
                })

                let parts = instance.url.split("/")[2].split(':')
                if (parts[1] > 9000) {
                    var type = parts[1] == 9001 ? ' : desktop' : ' : mobile'
                    serverinfo = parts[0].split('.')[0].replace('-', ' ') + type
                }

                instance.send = new Proxy(instance.send, {
                    apply: (target, thisArg, argumentsList) => {
                        if (thisArg.binaryType === 'arraybuffer'){
                            argumentsList[0]= parseSend(argumentsList[0])
                        }
                        return target.apply(thisArg, argumentsList)
                    }
                })
                return instance
            }
        })

        window.observe = 0
        var toggle_tocar = false

        function getData(key) {
            const txn = db.transaction('XMLHttpRequest', "readonly");
            const objStore = txn.objectStore('XMLHttpRequest')
            const consulta = objStore.get(key)
            consulta.onsuccess = e => {
                update(consulta.result)
            }
        }

        function update(data) {
            const objStore = db.transaction(['XMLHttpRequest'], "readwrite").objectStore('XMLHttpRequest');
            data.xhr.response = skindata.buffer
            const updateRequest = objStore.put(data)
            updateRequest.onsuccess = (event) => {
                console.info('ok')
            }
        }

        var BuildWorker = function(foo) {
            var str = foo.toString()
            .match(/^\s*function\s*\(\s*\)\s*\{(([\s\S](?!\}$))*[\s\S])/)[1];
            return new Worker(window.URL.createObjectURL(
                new Blob([str], { type: 'text/javascript' })));
        }

        window.ADS = {
            initAggregator: function() {}
        };

        window.ADS.showVideo = function(a, b) {
            UnityBridge.call("adsVideoCallback", "complete");
        }

        window.ADS_BANNER = {
            init: function() {},
            getStaticBannerTypes: function() {
                return [];
            },
        };

        window.TRACKER = {
            track: function(pEvent, pData) {},
            setParams: function(pParams) {},
            trackTiming: function(timingVar, category, value, label) {},
            setAccountId: function(pAccountId) {},
            init: function(pPlatform, pSocialId) {}
        }

        window.GA_TRACKER = {
            gaSendEvent: function() {},
            gaSendTiming: function() {},
            setAccountId: function(id) {}
        }

        class DataWriter {
            constructor(tipo) {
                this.data = [0, 0]
                this.int8(tipo)
            }
            int32(value) {
                this.data.push((value & 0xFF000000) >> 24)
                this.data.push((value & 0x00FF0000) >> 16)
                this.data.push((value & 0x0000FF00) >> 8)
                this.data.push((value & 0x000000FF))
            }
            int16(value) {
                this.data.push((value & 0x0000FF00) >> 8)
                this.data.push((value & 0x000000FF))
            }
            int8(value) {
                this.data.push(value)
            }
            setString(string) {
                var enc = new TextEncoder().encode(string)
                var length = enc.length
                this.data.push((length & 0x0000FF00) >> 8)
                this.data.push((length & 0x000000FF))
                enc.forEach(b => this.data.push(b))
            }
            get arrayData() {
                var length = this.data.length
                this.data[0] = (length & 0x0000FF00) >> 8
                this.data[1] = (length & 0x000000FF)
                return Uint8Array.from(this.data)
            }
        }

        window.DataWriter = DataWriter
        window.sendMaster = (array)=>{
            wsinstances.master.send(Uint8Array.from(array))
        }

        window.inserePacote = (byteArray, id)=>{
            const mod = UNITY();
            if (!mod) {
                console.error('[LBS] Module UnityBridge ainda não inicializado!');
                return;
            }
            const buffer = mod._malloc(byteArray.length);
            mod.HEAPU8.set(byteArray, buffer);
            mod["dynCall_viii"](onbinary, id, buffer, byteArray.length);
            mod._free(buffer);
        }

        function changeObserver(index) {
            var game = wsinstances.game
            var a = new DataWriter(9)
            a.int16(index)
            game.send(a.arrayData)
        }

        function observar(number) {
            var master = wsinstances.master
            var w = new DataWriter(171)
            w.int8(36)
            w.int32(number)
            w.int8(0)
            window.observe = number
            master.send(w.arrayData)
        };

        let distanceFromCenter= 0
        const center={x:0, y:0}

        document.addEventListener("mousemove", logKey);
        function logKey(e) {
            center.x = window.innerWidth/2
            center.y = window.innerHeight/2
            distanceFromCenter = distance(e.clientX, e.clientY, center.x, center.y)
        }

        window.moveto = function moveto(x, y){
            var m = new DataWriter(11)
            m.int16(4)
            m.int16(0)
            m.int16(x)
            m.int16(y)
            return m.arrayData
        }

        function distance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        }

        var arr=[]
        var arr2=[]
        const parseSend = function(buff) {
            if (buff[2] == 5) {
                if (window.observe > 0) {
                    let n = window.observe;
                    let x = new Uint8Array(Uint32Array.from([n]).buffer);
                    buff[3] = x[3];
                    buff[4] = x[2];
                    buff[5] = x[1];
                    buff[6] = x[0];
                    window.observe = 0;
                }
            }

            if(buff[2]==11){
                var acelerando = buff[4] == 17
                var angle = (buff[3] / 256) * Math.PI * 2;
                var cos = Math.cos(angle)
                var sin = Math.sin(angle)

                const L = 2000
                let x1 = mypos.x + (L * cos )
                let y1 = mypos.y + (L * sin )
                let x2 = mypos.x + (L+100 * cos)
                let y2 = mypos.y + (L+100 * sin)

                arr = [0 ,7  ,11 ,0 ,2   ,11 ,217 ,
                       0 ,11 ,11 ,0 ,132 ,11 ,217 ,0 ,0 ,0 ,0 ,
                       0 ,11 ,11 ,0 ,132 ,0  ,66  ,0 ,0 ,0 ,0 ]
                arr[14] = (x1 & 0x0000FF00) >> 8
                arr[15] = x1 & 0x000000FF
                arr[16] = (y1 & 0x0000FF00) >> 8
                arr[17] = y1 & 0x000000FF
                arr[25] = (x2 & 0x0000FF00) >> 8
                arr[26] = x2 & 0x000000FF
                arr[27] = (y2 & 0x0000FF00) >> 8
                arr[28] = y2 & 0x000000FF

                if (toggle_tocar) {
                    if (!acelerando) {
                        buff = Uint8Array.from(arr);
                    } else {
                        arr2 = [0, 7, 11, 0, 2, 11, 217, 0, 11, 11, 0, 132, 11, 217, 0, 0, 0, 0];
                        arr2[14] = (x1 & 0x0000FF00) >> 8;
                        arr2[15] = x1 & 0x000000FF;
                        arr2[16] = (y1 & 0x0000FF00) >> 8;
                        arr2[17] = y1 & 0x000000FF;
                        buff = Uint8Array.from(arr2);
                    }
                }
            }

            if (buff[2] == 100) {
                if (window.ismobile) {
                    buff[5] = 3;
                }
            }

            return buff
        }

        var worker = BuildWorker(function() {
            var refself = self
            refself.mysnake = {}
            refself.snakes =[]

            class Snake {
                constructor(r,inicio, fim) {
                    this.inicio = inicio
                    this.fim = fim
                    this.#initialize(r)
                }

                #initialize(r) {
                    this.id = r.int16()
                    this.skin_index = r.int8()
                    this.flagId = r.int8()
                    this.rank = r.int8()
                    this.playerName = r.getString()
                    this.mass = r.int32()
                    this.crowns = r.int8()
                    this.posx = r.int16()
                    this.posy = r.int16()
                    this.rotation = r.int8()
                    this.heading = r.int8()
                    this.speedData = r.int16()
                    this.lair = r.int8()
                    this.stop = r.int8()
                    this.bonus_boost = r.int8()
                    this.water_boost = r.int8()
                    this.pointCount = r.int16()
                    this.pointsX = []
                    this.pointsY = []
                    for (let i = 0; i < this.pointCount; i++) {
                        this.pointsX[i] = r.int8();
                        this.pointsY[i] = r.int8();
                    }
                    this.flags = r.int8()

                    if (this.flags == 1) {
                        this.firstLife = r.int8()
                    }

                    this.isPlayer = this.flags==1
                }
            }

            class Reader {
                constructor(data, id) {
                    this.id = id
                    this.data = data
                    this.offset = 0
                }

                int16() {
                    return (this.data[this.offset++] & 0xFF) << 8 | (this.data[this.offset++] & 0xFF) << 0
                }
                int32() {
                    return (this.data[this.offset++] & 255) << 24 |
                        (this.data[this.offset++] & 255) << 16 |
                        (this.data[this.offset++] & 255) << 8 |
                        this.data[this.offset++] & 255
                }

                int8() {
                    return this.data[this.offset++]
                }
                float() {
                    let arr = new Float32Array(Uint8Array.from(
                        [
                            this.data[this.offset++],
                            this.data[this.offset+1],
                            this.data[this.offset+2],
                            this.data[this.offset+3]
                        ].reverse()
                    ).buffer)
                    return arr[0]
                }
                get end() {
                    return this.offset == this.data.length;
                }
                getString() {
                    var len = this.int16()
                    var string = new TextDecoder().decode(Uint8Array.from( this.data.slice(this.offset, this.offset + len)))
                    this.offset += len
                    return string
                }
            }

            class Account {
                constructor(r) {
                    this.lastType = r.int8()
                    this.name = r.getString()
                    this.level = r.int16()
                    this.skin_id = r.int8()
                    this.flag_id = r.int8()
                    this.experience = r.int32();
                    this.gold = r.int32();
                    this.diamonds = r.int32();
                    this.chest_crowns = r.int8();
                    this.rating = r.int32();
                    this.rankIndex = r.int8();
                    this.priceRegion = r.int8();
                    this.subscription = r.int8();
                    this.had_trial = r.int8();
                    this.newbie = r.int8();
                    this.registered = r.int8();
                    this.tester = r.int8();
                    this.first_login = r.int8();
                    this.buffs = r.int8();
                    this.cards = r.int8();
                    this.everPlayedJuja = r.int8();
                    this.chestTrack = r.int8();
                    this.chestProgress = r.int8();
                    this.x = r.int16()
                    this.totkeys = r.int8()
                    this.chests = []
                    var chestsize = r.int8()
                    for (let i = 0; i < chestsize; i++) {
                        this.chests.push(r.int8())
                    }
                    this.royal_chest_type = r.int8();
                    this.royal_chest_time = r.int32();
                    this.premium_time = r.int32();
                    this.subscription_time = r.int32();
                    this.subscriptionid = r.getString();
                    this.skills = []
                    for (let i = 0; i < 10; i++) {
                        this.skills.push({ type: '', level: r.int8() })
                    }
                    const partial_skin_count = r.int8();
                    this.partial_skins = []
                    for (let i = 0; i < partial_skin_count; i++) {
                        const id = r.int8()
                        const skin=''
                        this.partial_skins.push(
                            { id, parts: r.int16(), skin }
                        )
                    }
                    this.skincount = r.int8()
                    this.owned_skins = []
                    for (let i = 0; i < this.skincount; i++) {
                        let id = r.int8()
                        const name = ''
                        this.owned_skins.push(
                            { id, name }
                        )
                    }

                    this.achievements = []
                    const achievement_count = r.int8()
                    for (let i = 0; i < achievement_count; i++) {
                        const id = r.int8()
                        const ach = {
                            type:0,
                            counter: r.int16(),
                            level: r.int8(),
                            pickedLevel: r.int8()
                        }
                        this.achievements.push(ach)
                    }
                    this.achievementGold = r.int8()
                    this.achievementRating = r.int8()
                    this.crownsSold = r.int8();
                    this.offer_id = r.int8();
                    this.offer_id_offset = r.offset-1
                    this.offerTitle =''
                    this.offertime = r.int32();
                    this.newbietime = r.int32();
                    const banner_count = r.int8();
                    this.banners = [];
                    for (var i = 0; i < banner_count; i++) {
                        this.banners.push({
                            type: r.int8(),
                            state: r.int8(),
                        });
                    }
                    this.gifttime = r.int32();
                    this.optionsUpdate = r.int8();
                    const smilescount = r.int8();
                    this.smiles = [];
                    for (var i = 0; i < smilescount; i++) {
                        this.smiles.push(r.int8());
                    }
                }
            }

            const parseMessage = (e, id) => {
                var r = new Reader(e, id)
                while (!r.end) {
                    var inicio = r.offset
                    var len = r.int16()
                    var next = r.offset + (len - 2)
                    var tipo = r.int8()
                    switch (tipo) {
                        case 116:
                            var token = r.getString()
                            self.postMessage({ msg: 116, token:token})
                            break
                        case 101:
                            self.postMessage({ msg: 101})
                            break
                        case 15:
                            var _id = r.int16()
                            var coord= {x : r.int16(), y : r.int16()}
                            if(refself.mysnake.id == _id){
                                self.postMessage({ msg: 15, pos:coord})
                            }
                            break
                        case 10:
                            var snake = new Snake(r,inicio, next)
                            self.postMessage({ msg: 2, action:1,snake})
                            if(snake.isPlayer){
                                refself.mysnake = snake
                            }
                            break
                        case 22:
                            var topplayers = [];
                            var count = r.int8();
                            for (let i = 0; i < count; i++) {
                                var row = {
                                    place: r.int16(),
                                    name: r.getString(),
                                    mass: r.int32(),
                                    crowns: r.int8(),
                                    skin: r.int8(),
                                    flags: r.int8(),
                                    accountId: r.int32(),
                                    id: r.int16(),
                                };
                                if (row.flags == 4 || row.flags==5) {
                                    rebeldeid = row.id;
                                }
                                topplayers.push(row);
                            }
                            self.postMessage({ msg: 1,topplayers})
                            break
                        case 6:
                            self.postMessage({ msg: 6})
                            break
                        case 7:
                            self.postMessage({ msg: 7})
                            break
                        case 12:
                            break
                        case 16:
                            var id = r.int16()
                            self.postMessage({ msg: 2, action:0,id})
                            break
                        case 106:
                            var accountdata= r.data.slice(inicio, next)
                            var c = new Account(r)
                            var offset = c.offer_id_offset
                            if(c.offer_id !== 26){
                                self.postMessage({ msg: 106, accountdata:accountdata, offset:offset})
                            }
                            break
                    }
                    r.offset = next
                }
            }

            var byteArray
            self.onmessage = function(e) {
                byteArray = new Uint8Array(e.data.byteArray)
                parseMessage(byteArray, self)
            }
        });

        window.process = function(array, id) {
            worker.postMessage({ byteArray: array }, [array])
        }

        var snakes = new Map()

        worker.onmessage = function(e) {
            switch(e.data.msg){
                case 6:
                    console.log('inicio do jogo')
                    break
                case 116:
                    window.open('https://secure.xsolla.com/paystation2/?access_token=' +e.data.token , '_blank');
                    break
                case 7:
                    console.log('fim do jogo')
                    toggle_tocar = false
                    currentUserData = null;
                    loginStartTime = null;
                    userAccountId = null;
                    userNickname = null;
                    if (usageInterval) {
                        clearInterval(usageInterval);
                        usageInterval = null;
                    }
                    break
                case 15:
                    mypos = e.data.pos
                    break
                case 106:
                    if (window.index === 0) {
                        setTimeout(() => {
                            const mod = UNITY();
                            if (!mod) return;

                            const heap = new Uint8Array(mod.HEAPU8.buffer);
                            const pattern = new Uint8Array([0xA3, 0x02, 0x00, 0x00, 0x8F, 0xC2, 0xF5, 0x3B]);
                            let found = -1;

                            for (let i = 0; i + pattern.length < heap.length; i++) {
                                let ok = true;
                                for (let j = 0; j < pattern.length; j++) {
                                    if (heap[i + j] !== pattern[j]) {
                                        ok = false;
                                        break;
                                    }
                                }
                                if (ok) {
                                    found = i;
                                    break;
                                }
                            }

                            if (found > 0) {
                                window.index = found;
                                updateScale(DEFAULT_SCALE);
                            }
                        }, 2000);
                    }

                    if (e.data.accountdata) {
                        try {
                            const userData = extractUserDataFromPacket106(e.data.accountdata);
                            if (userData) {
                                userAccountId = userData.accountId;
                                userNickname = userData.nickname;

                                if (!currentUserData) {
                                    setTimeout(() => {
                                        logModUsageStart();
                                    }, 2000);
                                }
                            }
                        } catch (error) {
                            console.error('[WEBHOOK] Erro ao processar pacote 106:', error);
                        }
                    }
                    break;
                case 1:
                    topplayers = e.data.topplayers
                    break
                case 2:
                    if(e.data.action==1){
                        var snake = e.data.snake
                        snakes.set(snake.id, snake)
                    }else{
                        var id = e.data.id
                        snakes.delete(id)
                    }
                    break
            }
        }

        const DEFAULT_SCALE = 675
        var toggle_scale = false
        var toggle_in = false
        var toggle_out = false

        function reconnect() {
            if (wsinstances.master.readyState !== undefined) {
                wsinstances.master.close()
            }
        }

        /* ===============================
           AIM ASSIST SYSTEM
        ================================= */
        let aimEnabled = false;
        let AIM_MAX_DISTANCE = 1200;
        let AIM_SMOOTH = 8;
        let AIM_INTERVAL = 40;
        let AIM_FORCE = 120;

        function aimDist(x1, y1, x2, y2) {
            const dx = x1 - x2;
            const dy = y1 - y2;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function getBestTargetFromSnakes() {
            let best = null;
            let bestD = Infinity;

            for (let [id, snake] of snakes) {
                if (!snake) continue;
                if (snake.isPlayer) continue;
                if (!snake.posx || !snake.posy) continue;

                const d = aimDist(mypos.x, mypos.y, snake.posx, snake.posy);
                if (d < bestD && d < AIM_MAX_DISTANCE) {
                    bestD = d;
                    best = snake;
                }
            }
            return best;
        }

        function applySmoothAim(targetX, targetY) {
            const dx = targetX - mypos.x;
            const dy = targetY - mypos.y;

            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return;

            const nx = dx / len;
            const ny = dy / len;

            const aimX = mypos.x + nx * AIM_FORCE;
            const aimY = mypos.y + ny * AIM_FORCE;

            if (wsinstances.game) {
                wsinstances.game.send(moveto(aimX, aimY));
            }
        }

        const aimInterval = setInterval(() => {
            if (!aimEnabled) return;
            if (!mypos || snakes.size === 0) return;

            const target = getBestTargetFromSnakes();
            if (!target) return;

            applySmoothAim(target.posx, target.posy);
        }, AIM_INTERVAL);

        // ===== PREDICTS SYSTEM =====
        (function() {
            'use strict';

            const predictsConfig = {
                enabled: false,
                lineWidth: 3,
                maxLength: 1200,
                alpha: 0.9,
                dashed: false,
                color: '#00ffff',
                useGradient: true,
                shadowBlur: 6,
                snapToCenter: true,
            };

            let origin = null;
            let mouse = { x: innerWidth/2, y: innerHeight/2 };

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.id = 'predicts-canvas';
            canvas.style.position = 'fixed';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '999997';
            canvas.style.display = 'none';

            const resize = () => {
                const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
                canvas.width = Math.floor(innerWidth * dpr);
                canvas.height = Math.floor(innerHeight * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            };

            const handleMouseMove = (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            };

            const handleClick = (e) => {
                if (e.altKey) {
                    origin = { x: e.clientX, y: e.clientY };
                    predictsConfig.snapToCenter = false;
                }
            };

            const clear = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            };

            const draw = () => {
                if (!predictsConfig.enabled) return;

                const ox = (predictsConfig.snapToCenter || !origin) ? innerWidth / 2 : origin.x;
                const oy = (predictsConfig.snapToCenter || !origin) ? innerHeight / 2 : origin.y;

                const dx = mouse.x - ox;
                const dy = mouse.y - oy;
                const dist = Math.hypot(dx, dy);
                const maxLen = predictsConfig.maxLength;
                const len = Math.min(dist, maxLen);

                const ux = dx / (dist || 1);
                const uy = dy / (dist || 1);

                const tx = ox + ux * len;
                const ty = oy + uy * len;

                ctx.save();
                ctx.globalAlpha = predictsConfig.alpha;
                ctx.lineWidth = predictsConfig.lineWidth;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                if (predictsConfig.dashed) ctx.setLineDash([10, 10]); else ctx.setLineDash([]);
                ctx.shadowBlur = predictsConfig.shadowBlur;

                if (predictsConfig.useGradient) {
                    const grad = ctx.createLinearGradient(ox, oy, tx, ty);
                    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
                    grad.addColorStop(0.15, predictsConfig.color);
                    grad.addColorStop(1, 'rgba(0,0,0,0.2)');
                    ctx.strokeStyle = grad;
                } else {
                    ctx.strokeStyle = predictsConfig.color;
                }

                ctx.beginPath();
                ctx.moveTo(ox, oy);
                ctx.lineTo(tx, ty);
                ctx.stroke();

                const headLen = Math.max(10, predictsConfig.lineWidth * 3);
                const angle = Math.atan2(uy, ux);
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI / 6), ty - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(tx, ty);
                ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI / 6), ty - headLen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();

                ctx.restore();
            };

            let animationFrameId = null;
            const loop = () => {
                try {
                    clear();
                    draw();
                } catch (err) {}
                if (predictsConfig.enabled) {
                    animationFrameId = requestAnimationFrame(loop);
                }
            };

            const startPredicts = () => {
                if (!canvas.isConnected) {
                    document.body.appendChild(canvas);
                    resize();
                    addEventListener('resize', resize);
                    addEventListener('mousemove', handleMouseMove, { passive: true });
                    addEventListener('click', handleClick);
                }
                canvas.style.display = 'block';
                loop();
            };

            const stopPredicts = () => {
                canvas.style.display = 'none';
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                clear();
            };

            const setupPredicts = () => {
                const enabled = localStorage.getItem('predicts_enabled') === '1';
                predictsConfig.enabled = enabled;

                if (enabled) {
                    startPredicts();
                } else {
                    stopPredicts();
                }

                const savedWidth = localStorage.getItem('predicts_width');
                if (savedWidth) predictsConfig.lineWidth = parseInt(savedWidth);

                const savedAlpha = localStorage.getItem('predicts_alpha');
                if (savedAlpha) predictsConfig.alpha = parseFloat(savedAlpha);

                const savedColor = localStorage.getItem('predicts_color');
                if (savedColor) predictsConfig.color = savedColor;

                const savedGradient = localStorage.getItem('predicts_gradient');
                if (savedGradient !== null) predictsConfig.useGradient = savedGradient === '1';

                const savedDashed = localStorage.getItem('predicts_dashed');
                if (savedDashed !== null) predictsConfig.dashed = savedDashed === '1';

                const savedMaxLength = localStorage.getItem('predicts_maxLength');
                if (savedMaxLength) predictsConfig.maxLength = parseInt(savedMaxLength);
            };

            window.PredictsSystem = {
                setEnabled: (enabled) => {
                    predictsConfig.enabled = enabled;
                    localStorage.setItem('predicts_enabled', enabled ? '1' : '0');
                    if (enabled) {
                        startPredicts();
                    } else {
                        stopPredicts();
                    }
                },
                setLineWidth: (width) => {
                    predictsConfig.lineWidth = width;
                    localStorage.setItem('predicts_width', width);
                },
                setAlpha: (alpha) => {
                    predictsConfig.alpha = alpha;
                    localStorage.setItem('predicts_alpha', alpha);
                },
                setColor: (color) => {
                    predictsConfig.color = color;
                    localStorage.setItem('predicts_color', color);
                },
                setUseGradient: (useGradient) => {
                    predictsConfig.useGradient = useGradient;
                    localStorage.setItem('predicts_gradient', useGradient ? '1' : '0');
                },
                setDashed: (dashed) => {
                    predictsConfig.dashed = dashed;
                    localStorage.setItem('predicts_dashed', dashed ? '1' : '0');
                },
                setMaxLength: (maxLength) => {
                    predictsConfig.maxLength = maxLength;
                    localStorage.setItem('predicts_maxLength', maxLength);
                },
                resetOrigin: () => {
                    origin = null;
                    predictsConfig.snapToCenter = true;
                },
                config: predictsConfig
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupPredicts, { once: true });
            } else {
                setTimeout(setupPredicts, 1000);
            }

            addEventListener('beforeunload', () => {
                if (canvas.isConnected) canvas.remove();
            });
        })();

        // ===== CUSTOM GROUND MOD =====
        (() => {
            const glProto = WebGL2RenderingContext.prototype;
            const oldClear = glProto.clear;
            const oldDraw = glProto.drawElements;

            let applied = false;

            let customGroundEnabled = false;
            let customGroundIntensity = 0.45;
            let customGroundColorValue = { r: 0, g: 0, b: 0 };

            function hexToRgb(hex) {
                const v = parseInt(hex.replace("#", ""), 16);
                return {
                    r: ((v >> 16) & 255) / 255,
                    g: ((v >> 8) & 255) / 255,
                    b: (v & 255) / 255
                };
            }

            glProto.clear = function (mask) {
                applied = false;
                return oldClear.call(this, mask);
            };

            glProto.drawElements = function (mode, count, type, offset) {
                const gl = this;

                if (customGroundEnabled && !applied && count > 800) {
                    applied = true;

                    gl.enable(gl.BLEND);
                    gl.blendColor(customGroundColorValue.r, customGroundColorValue.g, customGroundColorValue.b, customGroundIntensity);
                    gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE_MINUS_SRC_ALPHA);

                    oldDraw.call(this, mode, count, type, offset);
                    gl.disable(gl.BLEND);
                    return;
                }

                return oldDraw.call(this, mode, count, type, offset);
            };

            // ===== X2 SPEEDER (CORRIGIDO) =====
            const X2Speeder = {
                state: {
                    speed: 1.0
                },

                storageKey: 'berserk_speeder_settings',

                init: function() {
                    this.loadSettings();
                    this.injectSpeedHack();
                },

                loadSettings: function() {
                    try {
                        const saved = localStorage.getItem(this.storageKey);
                        if (saved) {
                            const settings = JSON.parse(saved);
                            this.state.speed = settings.speed || 1.0;
                        }
                    } catch (e) {
                        console.log('[X2 Speeder] Erro ao carregar configurações:', e);
                    }
                },

                saveSettings: function() {
                    try {
                        const settings = { speed: this.state.speed };
                        localStorage.setItem(this.storageKey, JSON.stringify(settings));
                    } catch (e) {
                        console.log('[X2 Speeder] Erro ao salvar configurações:', e);
                    }
                },

                createInjectionScript: function() {
                    return `
                    (function() {
                        if (window.__berserkSpeedHackInjected) return;
                        window.__berserkSpeedHackInjected = true;

                        const realPerfNow = performance.now.bind(performance);
                        const realDateNow = Date.now.bind(Date);

                        let speed = ${this.state.speed};
                        let baseTime = realPerfNow();
                        let virtualTime = baseTime;
                        let baseDate = realDateNow();
                        let virtualDate = baseDate;

                        const originalPerfNow = performance.now;
                        performance.now = function() {
                            const realNow = originalPerfNow();
                            const realElapsed = realNow - baseTime;
                            const acceleratedElapsed = realElapsed * speed;
                            return virtualTime + acceleratedElapsed;
                        };

                        const originalDateNow = Date.now;
                        Date.now = function() {
                            const realNow = originalPerfNow();
                            const realElapsed = realNow - baseTime;
                            const acceleratedElapsed = realElapsed * speed;
                            return Math.floor(virtualDate + acceleratedElapsed);
                        };

                        window.__updateBerserkSpeed = function(newSpeed) {
                            const now = originalPerfNow();
                            const currentVirtualTime = performance.now();

                            speed = newSpeed;
                            baseTime = now;
                            virtualTime = currentVirtualTime;
                            baseDate = originalDateNow();
                            virtualDate = Date.now();
                        };

                        window.__updateBerserkSpeed(speed);
                    })();
                    `;
                },

                injectSpeedHack: function() {
                    try {
                        const oldScript = document.querySelector('script[data-berserk-speeder]');
                        if (oldScript) oldScript.remove();

                        const script = document.createElement('script');
                        script.textContent = this.createInjectionScript();
                        script.setAttribute('data-berserk-speeder', 'true');

                        (document.head || document.documentElement).appendChild(script);
                    } catch (e) {
                        console.error('[X2 Speeder] Erro ao injetar script:', e);
                    }
                },

                updateSpeed: function(newSpeed) {
                    newSpeed = Math.max(0.1, Math.min(2.0, newSpeed)); // Limite de 0.1x a 2.0x

                    this.state.speed = newSpeed;
                    this.saveSettings();

                    if (window.__updateBerserkSpeed) {
                        window.__updateBerserkSpeed(newSpeed);
                    } else {
                        this.injectSpeedHack();
                    }

                    console.log('[X2 Speeder] Velocidade atualizada:', newSpeed + 'x');
                    return newSpeed;
                },

                resetSpeed: function() {
                    return this.updateSpeed(1.0);
                }
            };

            // Inicializar o speeder
            X2Speeder.init();
            window.X2Speeder = X2Speeder; // Tornar global
        })();

        // ===== INTERFACE DO USUÁRIO =====
        (function () {
            const DEFAULT_SCALE = window.DEFAULT_SCALE || 675;

            /* ========= LUCIDE ========= */
            if (!window.lucide) {
                const s = document.createElement("script");
                s.src = "https://unpkg.com/lucide@latest";
                s.onload = () => lucide.createIcons();
                document.head.appendChild(s);
            }

            const prev = document.getElementById("customUI");
            if (prev) prev.remove();

            const ui = document.createElement("div");
            ui.id = "customUI";
            ui.innerHTML = `
                <div class="lui-header">
                    <div class="header-left">
                        <i data-lucide="flame"></i>
                        <span class="header-title">BerserK Mod</span>
                    </div>
                    <div class="lui-user-compact">
                        <img class="lui-user-avatar" src="https://i.pinimg.com/736x/64/ed/2f/64ed2fc7db8637792088d41aa8d69451.jpg">
                        <div class="lui-user-info">
                            <div class="lui-user-name">Dragon 7</div>
                            <div class="lui-user-rank">${getTodayBR()}</div>
                        </div>
                    </div>
                </div>

                <div class="lui-container">
                    <div class="lui-sidebar">
                        <button class="sideBtn active" data-tab="zoom">
                            <i data-lucide="zoom-in"></i><span>Zoom</span>
                        </button>
                        <button class="sideBtn" data-tab="server">
                            <i data-lucide="earth-lock"></i><span>Server</span>
                        </button>
                        <button class="sideBtn" data-tab="aim">
                            <i data-lucide="crosshair"></i><span>Aim Assist</span>
                        </button>
                        <button class="sideBtn" data-tab="speeder">
                            <i data-lucide="chevrons-up"></i><span>X2 Speeder</span>
                        </button>
                        <button class="sideBtn" data-tab="predicts">
                            <i data-lucide="trending-up-down"></i><span>Predicts</span>
                        </button>
                        <button class="sideBtn" data-tab="misc">
                            <i data-lucide="layout-dashboard"></i><span>Misc</span>
                        </button>
                    </div>

                    <div class="lui-content">
                        <div class="tabContent activeTab" id="tab-zoom">
                            <div class="tabScroll">
                                <div class="hint">Tab → abrir / fechar menu</div>
                                <div class="divider"></div>
                                <div class="controlRow">
                                    <label>Zoom automático</label>
                                    <label class="switch">
                                        <input type="checkbox" id="zoomToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="controlRow">
                                    <label>Atalhos de zoom(b/n)</label>
                                    <label class="switch">
                                        <input type="checkbox" id="quickZoomToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="divider"></div>
                                <button id="resetZoom">Reset Zoom</button>
                            </div>
                        </div>

                        <div class="tabContent" id="tab-server">
                            <div class="tabScroll">
                                <div class="hint">Pressione <b>S</b> para trocar server rapidamente</div>
                                <label>Servidor</label>
                                <select id="serverType">
                                    <option value="Normal">Normal (PC)</option>
                                    <option value="Mobile">Mobile</option>
                                </select>
                                <div class="divider"></div>
                                <div class="serverInfo">
                                    <div style="font-size:11px; opacity:0.8;">
                                        <b>Como funciona:</b><br>
                                        • Normal (PC): Servidor padrão do jogo<br>
                                        • Mobile: Servidor otimizado para dispositivos móveis<br>
                                        • Use a tecla <b>S</b> para alternar rapidamente
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tabContent" id="tab-aim">
                            <div class="tabScroll">
                                <div class="serverInfo" style="margin-bottom: 12px;">
                                    <div style="font-size:11px; opacity:0.8;">
                                        <b>Como funciona:</b><br>
                                        • Detecta automaticamente cobras próximas<br>
                                        • Mira suavemente no alvo mais próximo<br>
                                        • Ajuste os parâmetros para sua preferência
                                    </div>
                                </div>
                                <div class="divider"></div>
                                <div class="controlRow">
                                    <label>Aim Assist</label>
                                    <label class="switch">
                                        <input type="checkbox" id="aimToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="slider-group">
                                    <label class="slider-label">Smooth</label>
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider" min="2" max="20" value="8" id="aimSmooth">
                                        <div class="slider-value" id="aimSmoothValue">8</div>
                                    </div>
                                </div>
                                <div class="slider-group">
                                    <label class="slider-label">Distância Máxima</label>
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider" min="300" max="2500" value="1200" id="aimDistance">
                                        <div class="slider-value" id="aimDistanceValue">1200</div>
                                    </div>
                                </div>
                                <div class="slider-group">
                                    <label class="slider-label">Velocidade (ms)</label>
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider" min="20" max="100" value="40" id="aimSpeed">
                                        <div class="slider-value" id="aimSpeedValue">40</div>
                                    </div>
                                </div>
                                <div class="slider-group">
                                    <label class="slider-label">Força à Frente</label>
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider" min="60" max="200" value="120" id="aimForce">
                                        <div class="slider-value" id="aimForceValue">120</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- TAB X2 SPEEDER -->
                        <div class="tabContent" id="tab-speeder">
                            <div class="tabScroll">
                                <div class="divider"></div>
                                <div style="text-align: center; margin-bottom: 16px;">
                                    <div id="speeder-display" class="speed-display">
                                        1.0x
                                    </div>
                                    <div style="font-size: 11px; color: #aaa;">Velocidade Atual</div>
                                    <div style="margin-top: 8px; font-size: 10px; color: #aaa; text-align: center;">
                                        <span id="fps-counter">FPS: --</span>
                                    </div>
                                </div>
                                <div class="slider-group">
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider"
                                               id="speeder-slider"
                                               min="5"
                                               max="20"
                                               value="10"
                                               step="1">
                                        <div class="slider-value" id="speeder-slider-value">1.0x</div>
                                    </div>
                                </div>
                                <div class="divider"></div>
                                <div style="margin-top: 16px;">
                                    <div class="slider-label">Presets Rápidos</div>
                                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; margin-top: 6px;">
                                        <button class="speed-preset-btn" data-speed="0.5">0.5x</button>
                                        <button class="speed-preset-btn" data-speed="0.7">0.7x</button>
                                        <button class="speed-preset-btn" data-speed="1.0">1.0x</button>
                                        <button class="speed-preset-btn" data-speed="1.3">1.3x</button>
                                        <button class="speed-preset-btn" data-speed="1.5">1.5x</button>
                                        <button class="speed-preset-btn" data-speed="1.7">1.7x</button>
                                        <button class="speed-preset-btn" data-speed="1.8">1.8x</button>
                                        <button class="speed-preset-btn" data-speed="1.9">1.9x</button>
                                        <button class="speed-preset-btn" data-speed="2.0">2.0x</button>
                                    </div>
                                </div>
                                <div class="divider"></div>
                                <button id="speeder-reset" class="speeder-reset-btn">
                                    Resetar para 1.0x
                                </button>
                            </div>
                        </div>

                        <!-- TAB PREDICTS (LINHA GUIA DO CURSOR) -->
                        <div class="tabContent" id="tab-predicts">
                            <div class="tabScroll">
                                <div class="serverInfo" style="margin-bottom: 12px;">
                                    <div style="font-size:11px; opacity:0.8;">
                                        <b>Linha Guia do Cursor</b><br>
                                        • Desenha uma linha da cabeça até o cursor<br>
                                        • Útil para prever movimentos e direção<br>
                                        • Toggle: <b>T</b> | Ajustes: <b>[ ]</b> | Fixar origem: <b>Alt+Clique</b>
                                    </div>
                                </div>
                                <div class="divider"></div>
                                <div class="controlRow">
                                    <label>Linha Guia Ativa</label>
                                    <label class="switch">
                                        <input type="checkbox" id="predictsToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="slider-group">
                                    <label class="slider-label">Espessura</label>
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider" min="1" max="10" value="3" id="predictsWidth">
                                        <div class="slider-value" id="predictsWidthValue">3</div>
                                    </div>
                                </div>
                                <div class="slider-group">
                                    <label class="slider-label">Opacidade</label>
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider" min="10" max="100" value="90" id="predictsAlpha">
                                        <div class="slider-value" id="predictsAlphaValue">90%</div>
                                    </div>
                                </div>
                                <div class="slider-group">
                                    <label class="slider-label">Comprimento Máximo</label>
                                    <div class="slider-container">
                                        <input type="range" class="custom-slider" min="300" max="2500" value="1200" id="predictsMaxLength">
                                        <div class="slider-value" id="predictsMaxLengthValue">1200</div>
                                    </div>
                                </div>
                                <label>Cor da Linha</label>
                                <input
                                    type="color"
                                    id="predictsColorPicker"
                                    value="#00ffff"
                                    style="width:100%; height:36px; border-radius:6px; border:1px solid var(--glass-border); cursor:pointer; margin-top:4px;"
                                >
                                <div class="divider"></div>
                                <div class="controlRow">
                                    <label>Gradiente</label>
                                    <label class="switch">
                                        <input type="checkbox" id="predictsGradientToggle" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="controlRow">
                                    <label>Linha Tracejada</label>
                                    <label class="switch">
                                        <input type="checkbox" id="predictsDashedToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="divider"></div>
                                <button id="predictsResetOrigin" style="margin-top: 10px;">
                                    Resetar Origem para Centro
                                </button>
                                <button id="predictsQuickToggle" style="margin-top: 6px; background: linear-gradient(135deg, rgba(0,255,255,0.3), rgba(0,200,200,0.3));">
                                    Atalho Rápido (P)
                                </button>
                            </div>
                        </div>

                        <!-- TAB MISC -->
                        <div class="tabContent" id="tab-misc">
                            <div class="tabScroll">
                                <div class="controlRow">
                                    <label>Night Mode</label>
                                    <label class="switch">
                                        <input type="checkbox" id="nightModeToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="controlRow">
                                    <label>Unlock FPS</label>
                                    <label class="switch">
                                        <input type="checkbox" id="unlockFpsToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="divider"></div>
                                <div class="controlRow">
                                    <label>Custom Ground Color</label>
                                    <label class="switch">
                                        <input type="checkbox" id="customGroundToggle">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <label style="margin-top:12px;">Escolher cor do Fundo</label>
                                <input
                                    type="color"
                                    id="customGroundColorPicker"
                                    value="#000000"
                                    style="width:100%; height:36px; border-radius:6px; border:1px solid var(--glass-border); cursor:pointer;"
                                >
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(ui);

            /* ========= STYLE OTIMIZADO COM BLUR UNIFORME ========= */
            const style = document.createElement("style");
            style.innerHTML = `
                :root {
                    --glass-bg: rgba(18, 20, 22, 0.86);
                    --glass-border: rgba(255, 255, 255, 0.12);
                    --blur-amount: 12px; /* UNIFORMIZADO PARA 12px */
                    --sidebar-bg: rgba(15, 17, 20, 0.75);
                }

                /* Efeito de blur uniforme aplicado ao container principal */
                #customUI {
                    position: fixed;
                    right: 24px;
                    top: 12%;
                    width: 540px;
                    height: 360px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(var(--blur-amount)) saturate(180%);
                    -webkit-backdrop-filter: blur(var(--blur-amount)) saturate(180%);
                    border-radius: 14px;
                    color: #e6eef3;
                    font-family: Inter, Arial, sans-serif;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--glass-border);
                    box-shadow:
                        0 20px 40px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.05),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                    overflow: hidden;
                    transform: translateZ(0);
                    will-change: transform;
                }

                /* Header com gradiente sutil e borda inferior */
                .lui-header {
                    padding: 6px 14px;
                    font-weight: 700;
                    font-size: 13px;
                    border-bottom: 1px solid var(--glass-border);
                    cursor: move;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 38px;
                    flex-shrink: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(30, 33, 38, 0.9),
                        rgba(25, 28, 32, 0.9)
                    );
                    backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    position: relative;
                    z-index: 2;
                }

                /* ========= HEADER CORRIGIDO ========= */
                .lui-header {
                    padding: 6px 14px;
                    font-weight: 700;
                    font-size: 13px;
                    border-bottom: 1px solid var(--glass-border);
                    cursor: move;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 38px;
                    flex-shrink: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(30, 33, 38, 0.9),
                        rgba(25, 28, 32, 0.9)
                    );
                    backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    position: relative;
                    z-index: 2;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .header-left i {
                    width: 18px;
                    height: 18px;
                    stroke: #ff6b6b;
                    stroke-width: 2.5px;
                    color: #ff6b6b;
                }

                .header-title {
                    font-weight: 600;
                    font-size: 13px;
                    color: #ffffff; /* Corrigido: branco simples sem brilho laranja */
                    letter-spacing: 0.3px;
                }

                /* User compact - estilo simplificado */
                .lui-user-compact {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 10px;
                    border-radius: 8px;
                    background: linear-gradient(
                        135deg,
                        rgba(40, 60, 90, 0.4),
                        rgba(20, 25, 35, 0.4)
                    );
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    transition: all 0.2s;
                    min-width: 100px;
                    position: relative;
                    overflow: hidden;
                }

                .lui-user-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    border: 2px solid rgba(255, 255, 255, 0.4);
                    object-fit: cover;
                }

                .lui-user-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }

                .lui-user-name {
                    font-size: 10px;
                    font-weight: 600;
                    color: #fff;
                    line-height: 1.1;
                    white-space: nowrap;
                }

                .lui-user-rank {
                    font-size: 8px;
                    color: #696969;
                    line-height: 1.1;
                    white-space: nowrap;
                    margin-top: 1px;
                }

                /* Container principal */
                .lui-container {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                    position: relative;
                }

                /* Sidebar com fundo levemente mais escuro */
                .lui-sidebar {
                    width: 110px;
                    border-right: 1px solid var(--glass-border);
                    padding: 8px 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex-shrink: 0;
                    overflow-y: auto;
                    background: var(--sidebar-bg);
                    backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    position: relative;
                }

                /* Efeito de brilho na borda da sidebar */
                .lui-sidebar::after {
                    content: '';
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 1px;
                    background: linear-gradient(
                        180deg,
                        transparent,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                }

                /* Botões da sidebar */
                .sideBtn {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    padding: 8px 6px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #cdd6dc;
                    line-height: 1;
                    font-size: 10px;
                    font-weight: 500;
                    transition: all 0.2s;
                    min-height: 32px;
                    position: relative;
                    overflow: hidden;
                }

                .sideBtn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.1),
                        rgba(255, 255, 255, 0.05)
                    );
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .sideBtn svg {
                    width: 14px;
                    height: 14px;
                    stroke: currentColor;
                    flex-shrink: 0;
                    position: relative;
                    z-index: 1;
                }

                .sideBtn span {
                    position: relative;
                    z-index: 1;
                }

                .sideBtn.active,
                .sideBtn:hover {
                    color: #fff;
                    box-shadow:
                        inset 0 0 0 1px rgba(255, 255, 255, 0.15),
                        0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .sideBtn.active::before,
                .sideBtn:hover::before {
                    opacity: 1;
                }

                .sideBtn.active {
                    background: rgba(111, 179, 255, 0.15);
                    border: 1px solid rgba(111, 179, 255, 0.3);
                }

                .sideBtn.active svg {
                    stroke: #6fb3ff;
                    filter: drop-shadow(0 0 4px rgba(111, 179, 255, 0.5));
                }

                /* Área de conteúdo */
                .lui-content {
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                    background: rgba(10, 12, 14, 0.4);
                    backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px); /* UNIFORMIZADO */
                }

                /* Scroll interno suave */
                .tabContent {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: none;
                    flex-direction: column;
                }

                .tabContent.activeTab {
                    display: flex;
                }

                .tabScroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 14px;
                    height: 100%;
                    position: relative;
                }

                /* Barra de scroll personalizada */
                .tabScroll::-webkit-scrollbar {
                    width: 6px;
                }

                .tabScroll::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 3px;
                    margin: 4px 0;
                }

                .tabScroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 3px;
                    transition: background 0.2s;
                }

                .tabScroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                /* Elementos internos - sem blur adicional */
                label {
                    font-size: 11px;
                    margin-top: 2px;
                    display: block;
                    color: #cdd6dc;
                    font-weight: 500;
                    letter-spacing: 0.2px;
                }

                input, select, textarea {
                    width: 100%;
                    margin-top: 4px;
                    padding: 6px 8px;
                    border-radius: 8px;
                    border: 1px solid var(--glass-border);
                    background: rgba(0, 0, 0, 0.3);
                    color: #fff;
                    outline: none;
                    font-size: 11px;
                    font-family: inherit;
                    transition: all 0.2s;
                }

                input:focus, select:focus, textarea:focus {
                    border-color: rgba(100, 160, 255, 0.6);
                    box-shadow:
                        0 0 0 2px rgba(100, 160, 255, 0.15),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
                    background: rgba(0, 0, 0, 0.4);
                }

                /* Controls rows */
                .controlRow {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 8px;
                    padding: 4px 0;
                }

                button {
                    margin-top: 10px;
                    padding: 8px;
                    width: 100%;
                    border-radius: 8px;
                    border: none;
                    background: linear-gradient(180deg, #2f3940, #232a2f);
                    color: #fff;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s;
                    position: relative;
                    overflow: hidden;
                }

                button::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                button:hover {
                    background: linear-gradient(180deg, #3a444b, #2d343a);
                    box-shadow:
                        0 4px 12px rgba(0, 0, 0, 0.3),
                        0 0 0 1px rgba(255, 255, 255, 0.1);
                    transform: translateY(-1px);
                }

                button:hover::before {
                    opacity: 1;
                }

                .divider {
                    height: 1px;
                    background: var(--glass-border);
                    margin: 8px 0;
                    position: relative;
                }

                .divider::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 0;
                    height: 1px;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.3),
                        transparent
                    );
                }

                /* Switches */
                .switch {
                    position: relative;
                    width: 36px;
                    height: 20px;
                }

                .switch input {
                    display: none;
                }

                .slider {
                    position: absolute;
                    inset: 0;
                    border-radius: 999px;
                    border: 1px solid var(--glass-border);
                    background: rgba(0, 0, 0, 0.4);
                    transition: .25s;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
                }

                .slider::before {
                    content: "";
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    left: 3px;
                    top: 2px;
                    background: linear-gradient(180deg, #fff, #f0f0f0);
                    border-radius: 50%;
                    transition: .25s;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                }

                .switch input:checked + .slider {
                    background: linear-gradient(135deg, #000000, #000000);
                    border-color: rgba(0, 0, 0, 0.9);
                    box-shadow:
                        inset 0 1px 3px rgba(0, 0, 0, 0.3),
                        0 0 8px rgba(0, 0, 0, 0.3);
                }

                .switch input:checked + .slider::before {
                    transform: translateX(16px);
                    background: linear-gradient(180deg, #fff, #e0e0e0);
                }

                /* Night dimmer overlay */
                #nightDimmer {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, .45);
                    pointer-events: none;
                    z-index: 99998;
                    display: none;
                    backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px); /* UNIFORMIZADO */
                }

                /* Sliders melhorados */
                .slider-group {
                    margin-top: 6px;
                    margin-bottom: 6px;
                }

                .slider-label {
                    font-size: 11px;
                    color: #cdd6dc;
                    margin-bottom: 3px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .slider-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-top: 2px;
                }

                .custom-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: rgba(0, 0, 0, 0.4);
                    outline: none;
                    margin: 0;
                    padding: 0;
                    position: relative;
                }

                .custom-slider::-webkit-slider-track {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: linear-gradient(
                        to right,
                        rgba(100, 160, 255, 0.2),
                        rgba(100, 160, 255, 0.9)
                    );
                    border: none;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
                }

                .custom-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: linear-gradient(180deg, #fff, #e0e0e0);
                    cursor: pointer;
                    border: 2px solid rgba(100, 160, 255, 0.9);
                    box-shadow:
                        0 2px 6px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.2);
                    transition: all 0.2s ease;
                    position: relative;
                }

                .custom-slider::-webkit-slider-thumb:hover {
                    background: linear-gradient(180deg, #fff, #f0f0f0);
                    border-color: rgba(120, 180, 255, 0.95);
                    transform: scale(1.15);
                    box-shadow:
                        0 3px 8px rgba(100, 160, 255, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.3);
                }

                .slider-value {
                    min-width: 34px;
                    text-align: center;
                    font-size: 10px;
                    font-weight: 500;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 3px 5px;
                    border-radius: 5px;
                    border: 1px solid var(--glass-border);
                    color: #fff;
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s;
                }

                /* Speed display */
                .speed-display {
                    font-size: 26px;
                    color: rgba(100, 160, 255, 0.9);
                    font-weight: bold;
                    margin-bottom: 6px;
                    text-shadow: 0 0 12px rgba(100, 160, 255, 0.6);
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.25);
                    border-radius: 10px;
                    border: 1px solid rgba(100, 160, 255, 0.3);
                    backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    box-shadow:
                        inset 0 1px 3px rgba(0, 0, 0, 0.3),
                        0 0 12px rgba(100, 160, 255, 0.2);
                }

                /* Server info boxes */
                .serverInfo {
                    background: rgba(0, 0, 0, 0.25);
                    border-radius: 8px;
                    padding: 10px;
                    margin-top: 8px;
                    border: 1px solid var(--glass-border);
                    font-size: 10px;
                    line-height: 1.4;
                    backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px); /* UNIFORMIZADO */
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
                }

                .hint {
                    font-size: 10px;
                    opacity: 0.8;
                    margin-bottom: 8px;
                    line-height: 1.4;
                    color: #a0b0c0;
                }

                /* Notifications */
                .lui-notif {
                    position: fixed;
                    right: 16px;
                    bottom: 16px;
                    background: rgba(12, 14, 16, 0.92);
                    backdrop-filter: blur(12px) saturate(180%); /* UNIFORMIZADO */
                    -webkit-backdrop-filter: blur(12px) saturate(180%); /* UNIFORMIZADO */
                    color: #e6eef3;
                    padding: 8px 12px;
                    border-radius: 8px;
                    box-shadow:
                        0 8px 24px rgba(0, 0, 0, 0.5),
                        0 0 0 1px rgba(255, 255, 255, 0.08);
                    transform: translateY(8px);
                    opacity: 0;
                    transition: all .28s ease;
                    z-index: 100000;
                    font-size: 11px;
                    border: 1px solid var(--glass-border);
                    max-width: 300px;
                }

                .lui-notif.show {
                    transform: translateY(0);
                    opacity: 1;
                }

                /* Preset buttons */
                .speed-preset-btn {
                    padding: 5px 3px;
                    font-size: 9px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #fff;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                    position: relative;
                    overflow: hidden;
                }

                .speed-preset-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.1),
                        transparent
                    );
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .speed-preset-btn:hover {
                    border-color: rgba(100, 160, 255, 0.4);
                    transform: scale(1.05);
                    box-shadow:
                        0 2px 8px rgba(100, 160, 255, 0.3),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
                }

                .speed-preset-btn:hover::before {
                    opacity: 1;
                }

                .speed-preset-btn.active {
                    background: rgba(100, 160, 255, 0.3);
                    border-color: rgba(100, 160, 255, 0.9);
                    box-shadow:
                        0 0 10px rgba(100, 160, 255, 0.5),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
                    color: #fff;
                }

                /* Special buttons */
                .speeder-reset-btn {
                    margin-top: 14px;
                    background: linear-gradient(
                        135deg,
                        rgba(100, 160, 255, 0.3),
                        rgba(80, 140, 235, 0.3)
                    );
                    border: 1px solid rgba(100, 160, 255, 0.4);
                    color: #fff;
                }

                .speeder-reset-btn:hover {
                    background: linear-gradient(
                        135deg,
                        rgba(100, 160, 255, 0.4),
                        rgba(80, 140, 235, 0.4)
                    );
                    border-color: rgba(100, 160, 255, 0.6);
                    box-shadow: 0 4px 15px rgba(100, 160, 255, 0.3);
                }

                #predictsQuickToggle:hover {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4));
                    border-color: rgba(255, 255, 255, 0.6);
                    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
                }

                /* Animation for value changes */
                @keyframes valuePulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                    100% { transform: scale(1); }
                }

                .slider-value.changed {
                    animation: valuePulse 0.3s ease;
                    background: rgba(100, 160, 255, 0.25);
                    border-color: rgba(100, 160, 255, 0.9);
                    box-shadow: 0 0 8px rgba(100, 160, 255, 0.3);
                }

                /* Performance optimization */
                #customUI * {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }

                /* Smooth transitions */
                #customUI,
                #customUI * {
                    transition: background-color 0.2s,
                               border-color 0.2s,
                               box-shadow 0.2s,
                               transform 0.2s;
                }
            `;
            document.head.appendChild(style);

            const dimmer = document.createElement("div");
            dimmer.id = "nightDimmer";
            document.body.appendChild(dimmer);

            setTimeout(() => {
                if (window.lucide) {
                    lucide.createIcons();
                }
            }, 100);

            /* ========= DRAG ========= */
            let dragging=false, ox=0, oy=0;
            const header = ui.querySelector(".lui-header");

            header.addEventListener("mousedown", e=>{
                dragging=true;
                ox=e.clientX-ui.offsetLeft;
                oy=e.clientY-ui.offsetTop;
                ui.style.transition = 'none';
            });

            document.addEventListener("mousemove", e=>{
                if(dragging){
                    ui.style.left=e.clientX-ox+"px";
                    ui.style.top=e.clientY-oy+"px";
                }
            });

            document.addEventListener("mouseup", ()=> {
                dragging=false;
                ui.style.transition = '';
            });

            /* ========= TABS ========= */
            ui.querySelectorAll(".sideBtn").forEach(btn=>{
                btn.onclick=()=>{
                    ui.querySelectorAll(".sideBtn").forEach(b=>b.classList.remove("active"));
                    ui.querySelectorAll(".tabContent").forEach(c=>{
                        c.classList.remove("activeTab");
                        c.style.display="none";
                    });

                    btn.classList.add("active");

                    const tabId = "tab-" + btn.dataset.tab;
                    const tabContent = document.getElementById(tabId);
                    if(tabContent){
                        tabContent.classList.add("activeTab");
                        tabContent.style.display="flex";

                        if (tabId === 'tab-speeder') {
                            const currentSpeed = window.X2Speeder ? window.X2Speeder.state.speed : 1.0;
                            document.getElementById('speeder-display').textContent = currentSpeed.toFixed(1) + 'x';
                            document.getElementById('speeder-slider-value').textContent = currentSpeed.toFixed(1) + 'x';

                            const sliderValue = Math.round(currentSpeed * 10);
                            document.getElementById('speeder-slider').value = sliderValue;

                            updatePresetButtons(currentSpeed);
                            setupFPSMonitor();
                        }
                    }
                };
            });

            /* ========= FUNÇÕES AUXILIARES ========= */
            function showUI(show) {
                ui.style.display = show ? 'flex' : 'none';
            }

            function notify(title, msg){
                const el = document.createElement('div');
                el.className = 'lui-notif';
                el.innerHTML = `<b>${title}</b><div style="opacity:0.85;font-size:10px;margin-top:3px">${msg}</div>`;
                document.body.appendChild(el);
                setTimeout(()=> el.classList.add('show'),20);
                setTimeout(()=> {
                    el.classList.remove('show');
                    setTimeout(()=> el.remove(),300);
                }, 3000);
            }

            function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

            function setupFPSMonitor() {
                let fps = 0;
                let frameCount = 0;
                let lastTime = performance.now();
                const fpsElement = document.getElementById('fps-counter');

                if (!fpsElement) return;

                function updateFPS() {
                    frameCount++;
                    const currentTime = performance.now();
                    const elapsed = currentTime - lastTime;

                    if (elapsed >= 500) {
                        fps = Math.round((frameCount * 1000) / elapsed);
                        frameCount = 0;
                        lastTime = currentTime;

                        fpsElement.textContent = `FPS: ${fps}`;

                        if (fps >= 100) {
                            fpsElement.style.color = '#7FFF00';
                        } else if (fps >= 60) {
                            fpsElement.style.color = '#FFD700';
                        } else if (fps >= 30) {
                            fpsElement.style.color = '#FF4500';
                        } else {
                            fpsElement.style.color = '#FF0000';
                        }
                    }

                    requestAnimationFrame(updateFPS);
                }

                requestAnimationFrame(updateFPS);
            }

            function updatePresetButtons(currentSpeed) {
                document.querySelectorAll('.speed-preset-btn').forEach(btn => {
                    const presetSpeed = parseFloat(btn.dataset.speed);
                    if (Math.abs(presetSpeed - currentSpeed) < 0.05) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }

            function animateValue(element) {
                element.classList.add('changed');
                setTimeout(() => {
                    element.classList.remove('changed');
                }, 300);
            }

            /* ========= REFERÊNCIAS ========= */
            const serverType = document.getElementById('serverType');
            const zoomToggle = document.getElementById('zoomToggle');
            const quickZoomToggle = document.getElementById('quickZoomToggle');
            const resetZoomBtn = document.getElementById('resetZoom');
            const nightModeToggle = document.getElementById('nightModeToggle');
            const unlockFpsToggle = document.getElementById('unlockFpsToggle');
            const customGroundToggle = document.getElementById('customGroundToggle');
            const customGroundColorPicker = document.getElementById('customGroundColorPicker');

            const aimToggle = document.getElementById('aimToggle');
            const aimSmooth = document.getElementById('aimSmooth');
            const aimSmoothValue = document.getElementById('aimSmoothValue');
            const aimDistance = document.getElementById('aimDistance');
            const aimDistanceValue = document.getElementById('aimDistanceValue');
            const aimSpeed = document.getElementById('aimSpeed');
            const aimSpeedValue = document.getElementById('aimSpeedValue');
            const aimForce = document.getElementById('aimForce');
            const aimForceValue = document.getElementById('aimForceValue');

            const predictsToggle = document.getElementById('predictsToggle');
            const predictsWidth = document.getElementById('predictsWidth');
            const predictsWidthValue = document.getElementById('predictsWidthValue');
            const predictsAlpha = document.getElementById('predictsAlpha');
            const predictsAlphaValue = document.getElementById('predictsAlphaValue');
            const predictsMaxLength = document.getElementById('predictsMaxLength');
            const predictsMaxLengthValue = document.getElementById('predictsMaxLengthValue');
            const predictsColorPicker = document.getElementById('predictsColorPicker');
            const predictsGradientToggle = document.getElementById('predictsGradientToggle');
            const predictsDashedToggle = document.getElementById('predictsDashedToggle');
            const predictsResetOrigin = document.getElementById('predictsResetOrigin');
            const predictsQuickToggle = document.getElementById('predictsQuickToggle');

            const speederSlider = document.getElementById('speeder-slider');
            const speederSliderValue = document.getElementById('speeder-slider-value');
            const speederDisplay = document.getElementById('speeder-display');
            const speederResetBtn = document.getElementById('speeder-reset');

            /* ========= RESTAURAR VALORES SALVOS ========= */
            try {
                serverType.value = localStorage.getItem('server_type') || 'Normal';
                window.ismobile = serverType.value === 'Mobile';
                zoomToggle.checked = (localStorage.getItem('zoom_enabled') === '1');
                quickZoomToggle.checked = (localStorage.getItem('quickzoom_enabled') === '1');
                nightModeToggle.checked = (localStorage.getItem('night_mode') === '1');
                unlockFpsToggle.checked = (localStorage.getItem('unlock_fps') === '1');

                customGroundEnabled = localStorage.getItem('customground_enabled') === '1';
                customGroundToggle.checked = customGroundEnabled;
                const savedColor = localStorage.getItem('customground_color') || '#000000';
                customGroundColorPicker.value = savedColor;
                customGroundColorValue = hexToRgb(savedColor);

                aimEnabled = localStorage.getItem('aim_enabled') === '1';
                aimToggle.checked = aimEnabled;
                AIM_SMOOTH = parseInt(localStorage.getItem('aim_smooth') || '8');
                aimSmooth.value = AIM_SMOOTH;
                aimSmoothValue.textContent = AIM_SMOOTH;
                AIM_MAX_DISTANCE = parseInt(localStorage.getItem('aim_distance') || '1200');
                aimDistance.value = AIM_MAX_DISTANCE;
                aimDistanceValue.textContent = AIM_MAX_DISTANCE;
                AIM_INTERVAL = parseInt(localStorage.getItem('aim_speed') || '40');
                aimSpeed.value = AIM_INTERVAL;
                aimSpeedValue.textContent = AIM_INTERVAL;
                AIM_FORCE = parseInt(localStorage.getItem('aim_force') || '120');
                aimForce.value = AIM_FORCE;
                aimForceValue.textContent = AIM_FORCE;

                const predictsEnabled = localStorage.getItem('predicts_enabled') === '1';
                predictsToggle.checked = predictsEnabled;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setEnabled(predictsEnabled);
                }

                const predictsWidthVal = parseInt(localStorage.getItem('predicts_width') || '3');
                predictsWidth.value = predictsWidthVal;
                predictsWidthValue.textContent = predictsWidthVal;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setLineWidth(predictsWidthVal);
                }

                const predictsAlphaVal = parseFloat(localStorage.getItem('predicts_alpha') || '0.9');
                predictsAlpha.value = Math.round(predictsAlphaVal * 100);
                predictsAlphaValue.textContent = Math.round(predictsAlphaVal * 100) + '%';
                if (window.PredictsSystem) {
                    window.PredictsSystem.setAlpha(predictsAlphaVal);
                }

                const predictsMaxLengthVal = parseInt(localStorage.getItem('predicts_maxLength') || '1200');
                predictsMaxLength.value = predictsMaxLengthVal;
                predictsMaxLengthValue.textContent = predictsMaxLengthVal;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setMaxLength(predictsMaxLengthVal);
                }

                const predictsColor = localStorage.getItem('predicts_color') || '#00ffff';
                predictsColorPicker.value = predictsColor;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setColor(predictsColor);
                }

                const predictsGradient = localStorage.getItem('predicts_gradient') !== '0';
                predictsGradientToggle.checked = predictsGradient;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setUseGradient(predictsGradient);
                }

                const predictsDashed = localStorage.getItem('predicts_dashed') === '1';
                predictsDashedToggle.checked = predictsDashed;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setDashed(predictsDashed);
                }

                // Carregar velocidade do speeder
                if (window.X2Speeder) {
                    const savedSpeed = window.X2Speeder.state.speed;
                    speederDisplay.textContent = savedSpeed.toFixed(1) + 'x';
                    speederSliderValue.textContent = savedSpeed.toFixed(1) + 'x';
                    speederSlider.value = Math.round(savedSpeed * 10);
                    updatePresetButtons(savedSpeed);
                }

                dimmer.style.display = nightModeToggle.checked ? "block" : "none";
            } catch(e){}

            /* ========= ESTADO ========= */
            let zoomEnabled = !!zoomToggle.checked;
            let quickZoomEnabled = !!quickZoomToggle.checked;
            let maxZoom = Number(localStorage.getItem('maxZoom')) || 600;
            let serverSwitchKey = 's';

            /* ========= updateScale safe ========= */
            function updateScaleSafe(value){
                const v = clamp(Number(value)|0, 300, 5000);
                const mod = (typeof UNITY === 'function') ? UNITY() : (window.UNITY ? UNITY() : null);
                if(!mod){ return false; }
                if (!window.index || window.index === 0) return false;
                try {
                    mod.HEAP32[window.index >> 2] = v;
                    localStorage.setItem('maxZoom', String(v));
                    return true;
                }
                catch(err){ return false; }
            }

            /* ========= SERVER SELECT ========= */
            function switchServer() {
                const currentValue = serverType.value;
                const newValue = currentValue === 'Normal' ? 'Mobile' : 'Normal';
                serverType.value = newValue;

                localStorage.setItem('server_type', newValue);
                window.ismobile = newValue === 'Mobile';
                notify('Servidor', `Trocado para ${newValue === 'Normal' ? 'PC' : 'Mobile'}`);

                try{
                    reconnect();
                    setTimeout(() => {
                        if (wsinstances.master && wsinstances.master.readyState === WebSocket.CLOSED) {
                            location.reload();
                        }
                    }, 1000);
                } catch(e){}
            }

            serverType.addEventListener('change', e=>{
                const val = e.target.value;
                localStorage.setItem('server_type', val);
                window.ismobile = val === 'Mobile';
                notify('Servidor', `Modo ${val === 'Normal' ? 'PC' : 'Mobile'}`);
                try{ reconnect(); } catch(e){}
            });

            /* ========= TOGGLES ========= */
            zoomToggle.addEventListener('change', e=>{
                zoomEnabled = e.target.checked;
                localStorage.setItem('zoom_enabled', zoomEnabled ? '1' : '0');
                notify('Zoom automático', zoomEnabled ? 'Ativado' : 'Desativado');
            });

            quickZoomToggle.addEventListener('change', e=>{
                quickZoomEnabled = e.target.checked;
                localStorage.setItem('quickzoom_enabled', quickZoomEnabled ? '1' : '0');
                notify('Atalhos zoom', quickZoomEnabled ? 'Ativados' : 'Desativados');
            });

            nightModeToggle.addEventListener('change', e=>{
                const enabled = e.target.checked;
                localStorage.setItem('night_mode', enabled ? '1' : '0');
                dimmer.style.display = enabled ? "block" : "none";
                notify('Night Mode', enabled ? 'Ativado' : 'Desativado');
            });

            unlockFpsToggle.addEventListener('change', e=>{
                const enabled = e.target.checked;
                localStorage.setItem('unlock_fps', enabled ? '1' : '0');
                if(enabled){
                    try {
                        const gameCanvas = document.getElementById('canvas');
                        if (gameCanvas) {
                            gameCanvas.style.willChange = 'transform';
                        }
                        if (window.document.body) {
                            window.document.body.style.overflow = 'hidden';
                        }
                    } catch (err) {
                        console.log('[Unlock FPS] Erro ao tentar desbloquear FPS:', err);
                    }
                    notify('Unlock FPS', 'Ativado - FPS ilimitado');
                } else {
                    notify('Unlock FPS', 'Desativado');
                }
            });

            customGroundToggle.addEventListener('change', e=>{
                customGroundEnabled = e.target.checked;
                localStorage.setItem('customground_enabled', customGroundEnabled ? '1' : '0');
                notify('Custom Ground', customGroundEnabled ? 'Ativado' : 'Desativado');
            });

            customGroundColorPicker.addEventListener('input', e=>{
                customGroundColorValue = hexToRgb(e.target.value);
                localStorage.setItem('customground_color', e.target.value);
            });

            /* ========= AIM ASSIST CONTROLS ========= */
            aimToggle.addEventListener('change', e=>{
                aimEnabled = e.target.checked;
                localStorage.setItem('aim_enabled', aimEnabled ? '1' : '0');
                notify('Aim Assist', aimEnabled ? 'Ativado' : 'Desativado');
            });

            aimSmooth.addEventListener('input', e=>{
                AIM_SMOOTH = parseInt(e.target.value);
                aimSmoothValue.textContent = AIM_SMOOTH;
                animateValue(aimSmoothValue);
                localStorage.setItem('aim_smooth', AIM_SMOOTH);
            });

            aimDistance.addEventListener('input', e=>{
                AIM_MAX_DISTANCE = parseInt(e.target.value);
                aimDistanceValue.textContent = AIM_MAX_DISTANCE;
                animateValue(aimDistanceValue);
                localStorage.setItem('aim_distance', AIM_MAX_DISTANCE);
            });

            aimSpeed.addEventListener('input', e=>{
                AIM_INTERVAL = parseInt(e.target.value);
                aimSpeedValue.textContent = AIM_INTERVAL;
                animateValue(aimSpeedValue);
                localStorage.setItem('aim_speed', AIM_INTERVAL);
            });

            aimForce.addEventListener('input', e=>{
                AIM_FORCE = parseInt(e.target.value);
                aimForceValue.textContent = AIM_FORCE;
                animateValue(aimForceValue);
                localStorage.setItem('aim_force', AIM_FORCE);
            });

            /* ========= PREDICTS CONTROLS ========= */
            predictsToggle.addEventListener('change', e=>{
                const enabled = e.target.checked;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setEnabled(enabled);
                }
                localStorage.setItem('predicts_enabled', enabled ? '1' : '0');
                notify('Predicts', enabled ? 'Ativado' : 'Desativado');
            });

            predictsWidth.addEventListener('input', e=>{
                const width = parseInt(e.target.value);
                predictsWidthValue.textContent = width;
                animateValue(predictsWidthValue);
                if (window.PredictsSystem) {
                    window.PredictsSystem.setLineWidth(width);
                }
                localStorage.setItem('predicts_width', width);
            });

            predictsAlpha.addEventListener('input', e=>{
                const alpha = parseInt(e.target.value) / 100;
                predictsAlphaValue.textContent = e.target.value + '%';
                animateValue(predictsAlphaValue);
                if (window.PredictsSystem) {
                    window.PredictsSystem.setAlpha(alpha);
                }
                localStorage.setItem('predicts_alpha', alpha);
            });

            predictsMaxLength.addEventListener('input', e=>{
                const maxLength = parseInt(e.target.value);
                predictsMaxLengthValue.textContent = maxLength;
                animateValue(predictsMaxLengthValue);
                if (window.PredictsSystem) {
                    window.PredictsSystem.setMaxLength(maxLength);
                }
                localStorage.setItem('predicts_maxLength', maxLength);
            });

            predictsColorPicker.addEventListener('input', e=>{
                const color = e.target.value;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setColor(color);
                }
                localStorage.setItem('predicts_color', color);
            });

            predictsGradientToggle.addEventListener('change', e=>{
                const useGradient = e.target.checked;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setUseGradient(useGradient);
                }
                localStorage.setItem('predicts_gradient', useGradient ? '1' : '0');
            });

            predictsDashedToggle.addEventListener('change', e=>{
                const dashed = e.target.checked;
                if (window.PredictsSystem) {
                    window.PredictsSystem.setDashed(dashed);
                }
                localStorage.setItem('predicts_dashed', dashed ? '1' : '0');
            });

            predictsResetOrigin.addEventListener('click', ()=>{
                if (window.PredictsSystem) {
                    window.PredictsSystem.resetOrigin();
                }
                notify('Predicts', 'Origem resetada para o centro');
            });

            predictsQuickToggle.addEventListener('click', ()=>{
                if (window.PredictsSystem) {
                    const newEnabled = !window.PredictsSystem.config.enabled;
                    window.PredictsSystem.setEnabled(newEnabled);
                    predictsToggle.checked = newEnabled;
                    localStorage.setItem('predicts_enabled', newEnabled ? '1' : '0');
                    notify('Predicts', newEnabled ? 'Ativado (P)' : 'Desativado (P)');
                }
            });

            /* ========= RESET ZOOM ========= */
            resetZoomBtn.addEventListener('click', ()=>{
                maxZoom = DEFAULT_SCALE;
                updateScaleSafe(DEFAULT_SCALE);
                notify('Zoom', 'Resetado para ' + DEFAULT_SCALE);
            });

            /* ========= X2 SPEEDER CONTROLS ========= */
            speederSlider.addEventListener('input', (e) => {
                const sliderValue = parseInt(e.target.value);
                const actualSpeed = sliderValue / 10; // 5-20 para 0.5-2.0

                // Usar X2Speeder
                if (window.X2Speeder && window.X2Speeder.updateSpeed) {
                    window.X2Speeder.updateSpeed(actualSpeed);
                }

                speederDisplay.textContent = actualSpeed.toFixed(1) + 'x';
                speederSliderValue.textContent = actualSpeed.toFixed(1) + 'x';

                updatePresetButtons(actualSpeed);
                animateValue(speederSliderValue);
            });

            document.querySelectorAll('.speed-preset-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const speed = parseFloat(e.target.dataset.speed);

                    if (window.X2Speeder && window.X2Speeder.updateSpeed) {
                        window.X2Speeder.updateSpeed(speed);
                    }

                    speederDisplay.textContent = speed.toFixed(1) + 'x';
                    speederSliderValue.textContent = speed.toFixed(1) + 'x';

                    const sliderValue = Math.round(speed * 10);
                    speederSlider.value = sliderValue;

                    updatePresetButtons(speed);
                    animateValue(speederSliderValue);
                    notify('X2 Speeder', `Velocidade: ${speed.toFixed(1)}x`);
                });
            });

            if (speederResetBtn) {
                speederResetBtn.addEventListener('click', () => {
                    if (window.X2Speeder && window.X2Speeder.resetSpeed) {
                        window.X2Speeder.resetSpeed();
                    }

                    speederDisplay.textContent = '1.0x';
                    speederSliderValue.textContent = '1.0x';
                    speederSlider.value = 10;

                    updatePresetButtons(1.0);
                    notify('X2 Speeder', 'Resetado para 1.0x');
                });
            }

            /* ========= WHEEL ZOOM ========= */
            window.addEventListener('wheel', e=>{
                if(!zoomEnabled) return;
                if(e.target && (e.target.closest && e.target.closest('#customUI'))) return;
                e.preventDefault();
                maxZoom = clamp(maxZoom + (e.deltaY > 0 ? 125 : -125), 300, 5000);
                updateScaleSafe(maxZoom);
            }, { passive:false });

            /* ========= CONTEXTMENU QUICK ZOOM ========= */
            document.addEventListener('contextmenu', function(ev) {
                if(!quickZoomEnabled) return true;
                ev.preventDefault();
                toggle_scale = !toggle_scale;
                updateScaleSafe(toggle_scale ? 900 : DEFAULT_SCALE);
                notify('Zoom', toggle_scale ? '900' : String(DEFAULT_SCALE));
                return false;
            }, false);

            /* ========= KEY HANDLERS ========= */
            document.addEventListener('keydown', function(e){
                if(e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;

                if(e.key === 'Tab'){
                    e.preventDefault();
                    showUI(ui.style.display === 'none');
                    return;
                }

                if(e.key && e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    switchServer();
                    return;
                }

                if(quickZoomEnabled){
                    if(e.key === 'b'){
                        toggle_in = !toggle_in;
                        updateScaleSafe(toggle_in ? 450 : DEFAULT_SCALE);
                        notify('Zoom', toggle_in ? '450' : String(DEFAULT_SCALE));
                    }
                    if(e.key === 'n'){
                        updateScaleSafe(1500);
                        notify('Zoom', '1500');
                    }
                }

                if(e.key && e.key.toLowerCase() === 'p') {
                    e.preventDefault();
                    if (window.PredictsSystem) {
                        const newEnabled = !window.PredictsSystem.config.enabled;
                        window.PredictsSystem.setEnabled(newEnabled);
                        predictsToggle.checked = newEnabled;
                        localStorage.setItem('predicts_enabled', newEnabled ? '1' : '0');
                        notify('Predicts', newEnabled ? 'Ativado (P)' : 'Desativado (P)');
                    }
                    return;
                }

                if (window.PredictsSystem && window.PredictsSystem.config.enabled) {
                    if(e.key === '[') {
                        const newWidth = Math.max(1, window.PredictsSystem.config.lineWidth - 1);
                        window.PredictsSystem.setLineWidth(newWidth);
                        predictsWidth.value = newWidth;
                        predictsWidthValue.textContent = newWidth;
                        localStorage.setItem('predicts_width', newWidth);
                        notify('Predicts', `Espessura: ${newWidth}`);
                    }
                    if(e.key === ']') {
                        const newWidth = Math.min(20, window.PredictsSystem.config.lineWidth + 1);
                        window.PredictsSystem.setLineWidth(newWidth);
                        predictsWidth.value = newWidth;
                        predictsWidthValue.textContent = newWidth;
                        localStorage.setItem('predicts_width', newWidth);
                        notify('Predicts', `Espessura: ${newWidth}`);
                    }
                    if(e.key === '-') {
                        const newAlpha = Math.max(0.1, +(window.PredictsSystem.config.alpha - 0.1).toFixed(2));
                        window.PredictsSystem.setAlpha(newAlpha);
                        predictsAlpha.value = Math.round(newAlpha * 100);
                        predictsAlphaValue.textContent = Math.round(newAlpha * 100) + '%';
                        localStorage.setItem('predicts_alpha', newAlpha);
                        notify('Predicts', `Opacidade: ${Math.round(newAlpha * 100)}%`);
                    }
                    if(e.key === '+') {
                        const newAlpha = Math.min(1.0, +(window.PredictsSystem.config.alpha + 0.1).toFixed(2));
                        window.PredictsSystem.setAlpha(newAlpha);
                        predictsAlpha.value = Math.round(newAlpha * 100);
                        predictsAlphaValue.textContent = Math.round(newAlpha * 100) + '%';
                        localStorage.setItem('predicts_alpha', newAlpha);
                        notify('Predicts', `Opacidade: ${Math.round(newAlpha * 100)}%`);
                    }
                    if(e.key.toLowerCase() === 'g') {
                        const newGradient = !window.PredictsSystem.config.useGradient;
                        window.PredictsSystem.setUseGradient(newGradient);
                        predictsGradientToggle.checked = newGradient;
                        localStorage.setItem('predicts_gradient', newGradient ? '1' : '0');
                        notify('Predicts', newGradient ? 'Gradiente: Ativado' : 'Gradiente: Desativado');
                    }
                    if(e.key.toLowerCase() === 'd') {
                        const newDashed = !window.PredictsSystem.config.dashed;
                        window.PredictsSystem.setDashed(newDashed);
                        predictsDashedToggle.checked = newDashed;
                        localStorage.setItem('predicts_dashed', newDashed ? '1' : '0');
                        notify('Predicts', newDashed ? 'Tracejado: Ativado' : 'Tracejado: Desativado');
                    }
                    if(e.key.toLowerCase() === 'c') {
                        if (window.PredictsSystem) {
                            window.PredictsSystem.resetOrigin();
                        }
                        notify('Predicts', 'Origem resetada para o centro');
                    }
                }
            });

            /* ========= EXPORT ========= */
            window.LBS_UI = {
                updateScaleSafe,
                showUI: ()=>showUI(true),
                hideUI: ()=>showUI(false),
                switchServer
            };
        })();
    }

    function init() {
        addStyles();
        isAlreadyLoggedIn() ? startBerserkMod() : showLogin();
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();
})();
