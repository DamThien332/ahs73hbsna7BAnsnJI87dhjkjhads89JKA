// ==UserScript==
// @name         Berserk Mod (LBS)
// @namespace    http://tampermonkey.net/
// @version      0.138b
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
        username: 'BsK',
        password: 'BsK_MOD'
    };

    const EXPIRATION_DATE = new Date('2026-01-19T23:59:59');

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
    // ========== FUNÇÕES DE WEBHOOK ==========

// Função para extrair dados do usuário do pacote 106
function extractUserDataFromPacket106(accountdata) {
    try {
        if (!accountdata || accountdata.length < 50) {
            console.log('[WEBHOOK] Dados muito curtos:', accountdata?.length);
            return null;
        }

        // Classe Reader simplificada para parsear os dados
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
                    // Tentar extrair string UTF-8
                    let str = '';
                    for (let i = 0; i < bytes.length; i++) {
                        const b = bytes[i];
                        if (b === 0) break; // Null terminator
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

        // Pular cabeçalho do pacote (tamanho + tipo)
        const packetLength = reader.int16();
        const tipo = reader.int8();

        console.log('[WEBHOOK] Pacote 106 detectado, comprimento:', packetLength, 'tipo:', tipo);

        if (tipo !== 106) {
            console.log('[WEBHOOK] Não é pacote 106, tipo:', tipo);
            return null;
        }

        // Ler dados do pacote 106 (UPDATE_ACCOUNT)
        reader.int8(); // lastType

        const nickname = reader.getString();
        console.log('[WEBHOOK] Nickname raw:', nickname);

        // Pular campos até chegar no accountId
        reader.int16(); // level
        reader.int8(); // skin_id
        reader.int8(); // flag_id
        reader.int32(); // experience
        reader.int32(); // gold
        reader.int32(); // diamonds
        reader.int8(); // chest_crowns

        // Aqui está o RATING (que estava sendo usado como accountId)
        const rating = reader.int32();
        console.log('[WEBHOOK] Rating:', rating);

        reader.int8(); // rankIndex
        reader.int8(); // priceRegion
        reader.int8(); // subscription
        reader.int8(); // had_trial
        reader.int8(); // newbie
        reader.int8(); // registered
        reader.int8(); // tester
        reader.int8(); // first_login
        reader.int8(); // buffs
        reader.int8(); // cards
        reader.int8(); // everPlayedJuja
        reader.int8(); // chestTrack
        reader.int8(); // chestProgress
        reader.int16(); // x
        reader.int8(); // totkeys

        // Chests
        const chestSize = reader.int8();
        for (let i = 0; i < chestSize; i++) {
            reader.int8();
        }

        reader.int8(); // royal_chest_type
        reader.int32(); // royal_chest_time
        reader.int32(); // premium_time
        reader.int32(); // subscription_time

        const subscriptionId = reader.getString();
        console.log('[WEBHOOK] Subscription ID:', subscriptionId);

        // Pular skills (10 * int8)
        for (let i = 0; i < 10; i++) {
            reader.int8();
        }

        // Partial skins
        const partialSkinCount = reader.int8();
        for (let i = 0; i < partialSkinCount; i++) {
            reader.int8(); // id
            reader.int16(); // parts
        }

        // Owned skins
        const skinCount = reader.int8();
        for (let i = 0; i < skinCount; i++) {
            reader.int8();
        }

        // Achievements
        const achievementCount = reader.int8();
        for (let i = 0; i < achievementCount; i++) {
            reader.int8(); // id
            reader.int16(); // counter
            reader.int8(); // level
            reader.int8(); // pickedLevel
        }

        reader.int8(); // achievementGold
        reader.int8(); // achievementRating
        reader.int8(); // crownsSold
        reader.int8(); // offer_id
        reader.int32(); // offertime
        reader.int32(); // newbietime

        // Banners
        const bannerCount = reader.int8();
        for (let i = 0; i < bannerCount; i++) {
            reader.int8(); // type
            reader.int8(); // state
        }

        reader.int32(); // gifttime
        reader.int8(); // optionsUpdate

        // Smiles
        const smilesCount = reader.int8();
        for (let i = 0; i < smilesCount; i++) {
            reader.int8();
        }

        // Agora tenta pegar o accountId REAL
        // Pode ser que esteja em outro lugar ou precise de outro método

        // Limpar nickname
        let cleanNickname = nickname.replace(/[^\x20-\x7E]/g, '').trim();
        if (!cleanNickname || cleanNickname.length < 2) {
            cleanNickname = 'UnknownPlayer';
        }

        // Vou tentar uma abordagem diferente: monitorar o pacote 22 (topplayers)
        // que geralmente tem o accountId correto

        console.log('[WEBHOOK] Dados extraídos do pacote 106:', {
            nickname: cleanNickname,
            rating: rating,
            offset: reader.offset,
            dataLength: accountdata.length
        });

        return {
            nickname: cleanNickname,
            // Usar rating temporariamente, mas vamos buscar o ID real de outra forma
            accountId: rating
        };
    } catch (error) {
        console.error('[WEBHOOK] Erro ao extrair dados do pacote 106:', error);
        console.log('[WEBHOOK] Dump dos primeiros 50 bytes:',
            accountdata.slice(0, 50).map(b => b.toString(16).padStart(2, '0')).join(' '));
        return null;
    }
}

    // ========== FUNÇÕES EXISTENTES ==========

    function isAlreadyLoggedIn() {
        try {
            const data = JSON.parse(localStorage.getItem('BsK_mod'));
            if (!data) return false;
            if (new Date() > new Date(data.expiresAt)) {
                localStorage.removeItem('BsK_mod');
                return false;
            }
            return data.loggedIn === true;
        } catch {
            return false;
        }
    }

    function saveLogin() {
        localStorage.setItem('BsK_mod', JSON.stringify({
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

                // Log de login bem-sucedido
                logLoginAttempt(username, true);

                if (r.checked) saveLogin();
                document.body.style.overflow = '';
                overlay.remove();
                startBerserkMod();
            } else {
                // Log de tentativa falha
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
let pinginterval;
window.ctx = ctx;

// Hook para inicializar nosso canvas quando o cliente estiver pronto
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


// Construct a table with table[i] as the length of the longest prefix of the substring 0..i
window.longestPrefix = function longestPrefix(str) {

    // create a table of size equal to the length of `str`
    // table[i] will store the prefix of the longest prefix of the substring str[0..i]
    var table = new Array(str.length);
    var maxPrefix = 0;
    // the longest prefix of the substring str[0] has length
    table[0] = 0;

    // for the substrings the following substrings, we have two cases
    for (var i = 1; i < str.length; i++) {
        // case 1. the current character doesn't match the last character of the longest prefix
        while (maxPrefix > 0 && str[i] !== str[maxPrefix]) {
            // if that is the case, we have to backtrack, and try find a character  that will be equal to the current character
            // if we reach 0, then we couldn't find a chracter
            maxPrefix = table[maxPrefix - 1];
        }
        // case 2. The last character of the longest prefix matches the current character in `str`
        if (str[maxPrefix] === str[i]) {
            // if that is the case, we know that the longest prefix at position i has one more character.
            // for example consider `-` be any character not contained in the set [a-c]
            // str = abc----abc
            // consider `i` to be the last character `c` in `str`
            // maxPrefix = will be 2 (the first `c` in `str`)
            // maxPrefix now will be 3
            maxPrefix++;
            // so the max prefix for table[9] is 3
        }
        table[i] = maxPrefix;
    }

    return table;
}

// Find all the patterns that matches in a given string `str`
// this algorithm is based on the Knuth–Morris–Pratt algorithm. Its beauty consists in that it performs the matching in O(n)
window.kmpMatching = function kmpMatching(str, pattern) {
    // find the prefix table in O(n)
    var prefixes = longestPrefix(pattern);
    var matches = [];

    // `j` is the index in `P`
    var j = 0;
    // `i` is the index in `S`
    var i = 0;
    while (i < str.length) {
        // Case 1.  S[i] == P[j] so we move to the next index in `S` and `P`
        if (str[i] === pattern[j]) {
            i++;
            j++;
        }
        // Case 2.  `j` is equal to the length of `P`
        // that means that we reached the end of `P` and thus we found a match
        if (j === pattern.length) {
            matches.push(i-j);
            // Next we have to update `j` because we want to save some time
            // instead of updating to j = 0 , we can jump to the last character of the longest prefix well known so far.
            // j-1 means the last character of `P` because j is actually `P.length`
            // e.g.
            // S =  a b a b d e
            // P = `a b`a b
            // we will jump to `a b` and we will compare d and a in the next iteration
            // a b a b `d` e
            //     a b `a` b
            j = prefixes[j-1];
        }
        // Case 3.
        // S[i] != P[j] There's a mismatch!
        else if (str[i] !== pattern[j]) {
            // if we have found at least a character in common, do the same thing as in case 2
            if (j !== 0) {
                j = prefixes[j-1];
            } else {
                // otherwise, j = 0, and we can move to the next character S[i+1]
                i++;
            }
        }
    }

    return matches;
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
    let _heigth = 900 // (_width*9)/16
    canvas.id = 'canvas2'
    canvas.style = 'width: 100%; height: 100%;position:relative; display:none;  top: 0;left: 0;position: absolute;z-index:0;  pointer-events: none;'
    var gamecanvas =document.getElementById('canvas')
    // gamecanvas.style=`position:absolute;width: ${_width}px;height: ${_heigth}px;left: 50%;top: 50%;margin-left: -${_width/2}px;margin-top: -${_heigth/2}px;`
    gamecanvas.style.zIndex=1000
    ctx = canvas.getContext('2d')
    ctx.canvas.width  = window.innerWidth
    ctx.canvas.height = window.innerHeight
    gamecanvas.parentElement.appendChild(canvas)
    //   document.body.appendChild(canvas)
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
    //console.log(data.length)
}
WebSocket = new Proxy(WebSocket, {
    construct: (target, args) => {
        var _url = args[0].replace('8080', '8443')
        args[0] = _url
        if(_url == 'wss://master.littlebigsnake.com:8443/'){
            //  args[0] = 'wss://viper.neodinamika.com:8443/'
        }
        let instance = new target(...args)
        switch (_url) {
            case 'wss://master.littlebigsnake.com:8443/':
            case 'wss://viper.neodinamika.com:8443/':
                wsinstances.master = instance
                break
            case 'wss://littlebigsnake.com:8443/':
            case 'wss://littlebigsnake.com:8080/':
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
                                //  return  window.process(argumentlist[0].data, thisArg.id)
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
var toggle_info = false
var toggle_tocar = false
/*var serverinfo = document.createElement('div')
window.serverinfo = serverinfo
serverinfo.style = 'position:absolute;color:#DCDCDC;text-shadow: 1px 1px black ; top:0;left:200px; margin:auto; padding:20px; display:none;  text-transform: capitalize;background-color: rgba(0, 0, 0, 0.5)'
document.body.appendChild(serverinfo)*/
var db, db2;
var request = indexedDB.open("UnityCache");
request.onsuccess = function(event) {
    db = request.result;
};
var request2 = indexedDB.open("/idbfs");
request2.onsuccess = function(event) {
    db2 = request.result;
};

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

function updateCache() {
    const keysTr = db.transaction('XMLHttpRequest').objectStore('XMLHttpRequest').getAllKeys()
    keysTr.onsuccess = (event) => {
        var data = keysTr.result.filter(k => k.indexOf('skins') != -1)
        if (data.length > 0) {
            data.forEach(d => getData(d))
        }
    }
}

function remove_records() {
    try {
        const keysTr = db2.transaction('FILE_DATA').objectStore('FILE_DATA').getAllKeys()
        keysTr.onsuccess = (event) => {
            var data = keysTr.result.filter(f => f.indexOf('skins') !== -1)
            data.forEach(k => delete_record(k))
        }
        setTimeout(APP.reload, 3000)
    } catch (e) {}
}

function delete_record(key) {
    const deletion = db2.transaction(['FILE_DATA'], 'readwrite').objectStore('FILE_DATA').delete(key)
    deletion.onsuccess = e => {
        console.info('deletado', key)
    }
}

function show_records() {
    const keysTr = db2.transaction('FILE_DATA').objectStore('FILE_DATA').getAllKeys()
    keysTr.onsuccess = (event) => {
        var data = keysTr.result.filter(f => f.indexOf('skins') !== -1)
        data.forEach(k => console.info(k))
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
};
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
const tocir = {
    x: 0,
    y: 0,
}
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
window.moveto2 = function moveto(x, y){
    var m = new DataWriter(11)
    m.int16(4)
    m.int16(0)
    m.int16(x)
    m.int16(y)
    let g = wsinstances.game
    g.send( m.arrayData)

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
    if(buff[2]==4){
        //   console.log('CS_CLIENT_REMathADY\n'+buff.join(',') + '\n')
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
// console.log('SEND:\n',buff.join(','),'\n')
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
            if(this.flags == 1 || this.flags == 5){
                // console.log(`ADD SNAKE\n${this.playerName}\n`,this.flags,r.data.slice(r.offset, this.fim).join(',') + '\n')
            }

            if (this.flags == 1) {

                this.firstLife = r.int8()


                //this.viewScaleFactor = r.float()
                //this.energyChargeRate = r.float()
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
            //console.log(`[${this.data[this.offset]}, ${this.data[this.offset+1]}, ${this.data[this.offset+2]}, ${this.data[this.offset+3]}]`)
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
        zerar() {
            // errado
            this.data[2] = 0
        }
        display(tag=''){
            console.log(`%c${tag}\n${this.data.join(',')}\n`, 'color:DodgerBlue')
        }
        getString() {
            var len = this.int16()
            var string = new TextDecoder().decode(Uint8Array.from( this.data.slice(this.offset, this.offset + len)))
            this.offset += len
            //console.log(this.offset)
            return string
        }
        send() {
            //  self.postMessage({ msg: 0, byteArray: this.data,id: this.id })
        }

    }

    const constants ={
        chests : [
            "NONE",
            "Bau Madeira",
            "Bau Ferro",
            "Bau Ouro",
            "Bau Rubi",
            "Bau ROYAL",
            "XP",
            "Ouro",
            "Rubi",
            "Comum",
            "Rara",
            "Epica",
        ],
        skills : ['ENTOMOPHAGOUS',
                  'ENTOMOLOGIST_BOOK',
                  'METABOLISM',
                  'EATER_BOOK',
                  'MAGNETISM',
                  'ATTRACTION_BOOK',
                  'VIEW',
                  'VIEWER_BOOK',
                  'ENERGY',
                  'LIGHTNING_BOOK'],
        offers:[
            {
                "enabled": true,
                "id": 20,
                "title": {
                    "ru": "Премиальный старт",
                    "en": "Premium Start"
                },
                "count": 1,
                "gold": 5600,
                "diamonds": 800,
                "exp": 0,
                "premium": 0,
                "ordinary": 0,
                "rare": 0,
                "epic": 2,
                "currency": { "prices": [ 1.99, 1.99, 0.99 ], "votes": 22 },
                "discount": 80.1,
                "discountVk": 80.0,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 3,
                "weight": 100,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 21,
                "title": { "ru": "Набор сталкера", "en": "Stalker's Set" },
                "count": 1,
                "gold": 17000,
                "diamonds": 0,
                "exp": 0,
                "premium": 7,
                "ordinary": 2,
                "rare": 2,
                "epic": 1,
                "currency": { "prices": [ 3.99, 2.99, 1.99 ], "votes": 45 },
                "discount": 71.5,
                "discountVk": 70.78,
                "requiredId": 20,
                "duration": 1,
                "cooldown": 3,
                "weight": 100,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 22,
                "title": {
                    "ru": "Неделя приключений",
                    "en": "Adventures week"
                },
                "count": 1,
                "gold": 20000,
                "diamonds": 2500,
                "exp": 0,
                "premium": 7,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 5.99, 4.99, 2.99 ], "votes": 67 },
                "discount": 75.04,
                "discountVk": 74.81,
                "requiredId": 21,
                "duration": 1,
                "cooldown": 3,
                "weight": 100,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 23,
                "title": { "ru": "Элитный пакет", "en": "Elite Pack" },
                "count": 1,
                "gold": 18000,
                "diamonds": 2000,
                "exp": 0,
                "premium": 30,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 5.99, 4.99, 2.99 ], "votes": 67 },
                "discount": 75.04,
                "discountVk": 75.19,
                "requiredId": 22,
                "duration": 1,
                "cooldown": 3,
                "weight": 100,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 24,
                "title": { "ru": "Набор Победителя", "en": "Winner's Set" },
                "count": 1,
                "gold": 6000,
                "diamonds": 0,
                "exp": 25000,
                "premium": 30,
                "ordinary": 4,
                "rare": 3,
                "epic": 3,
                "currency": { "prices": [ 9.99, 7.99, 4.99 ], "votes": 112 },
                "discount": 80.02,
                "discountVk": 80.11,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 3,
                "weight": 100,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 25,
                "title": {
                    "ru": "Пещерная распродажа",
                    "en": "Cave Sale"
                },
                "count": 1,
                "gold": 6000,
                "diamonds": 2000,
                "exp": 20000,
                "premium": 0,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 9.99, 7.99, 4.99 ], "votes": 112 },
                "discount": 77.8,
                "discountVk": 77.87,
                "requiredId": 24,
                "duration": 1,
                "cooldown": 5,
                "weight": 100,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 26,
                "title": {
                    "ru": "Рубиновая распродажа",
                    "en": "Ruby Sale"
                },
                "count": 1,
                "gold": 0,
                "diamonds": 8000,
                "exp": 20000,
                "premium": 0,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 9.99, 7.99, 4.99 ], "votes": 112 },
                "discount": 77.8,
                "discountVk": 77.87,
                "requiredId": 24,
                "duration": 1,
                "cooldown": 5,
                "weight": 100,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 27,
                "title": { "ru": "Неделя премиума", "en": "Premium Week" },
                "count": 10,
                "gold": 3200,
                "diamonds": 400,
                "exp": 0,
                "premium": 7,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 1.99, 1.99, 0.99 ], "votes": 22 },
                "discount": 60.2,
                "discountVk": 59.26,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 7,
                "weight": 10,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 28,
                "title": { "ru": "Месяц премиума", "en": "Premium Month" },
                "count": 10,
                "gold": 5000,
                "diamonds": 0,
                "exp": 4000,
                "premium": 30,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 3.99, 3.99, 1.99 ], "votes": 45 },
                "discount": 55.67,
                "discountVk": 53.13,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 7,
                "weight": 10,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 29,
                "title": { "ru": "Рубиновый клад", "en": "Ruby Treasure" },
                "count": 10,
                "gold": 0,
                "diamonds": 2500,
                "exp": 2000,
                "premium": 0,
                "ordinary": 0,
                "rare": 1,
                "epic": 1,
                "currency": { "prices": [ 5.99, 4.99, 2.99 ], "votes": 67 },
                "discount": 60.07,
                "discountVk": 61.05,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 7,
                "weight": 10,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 30,
                "title": { "ru": "Золотой клад", "en": "Gold Treasure" },
                "count": 10,
                "gold": 25000,
                "diamonds": 0,
                "exp": 2500,
                "premium": 0,
                "ordinary": 1,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 5.99, 4.99, 2.99 ], "votes": 67 },
                "discount": 57.21,
                "discountVk": 56.21,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 7,
                "weight": 10,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 31,
                "title": {
                    "ru": "Рубиновый клондайк",
                    "en": "Ruby Klondike"
                },
                "count": 10,
                "gold": 4500,
                "diamonds": 3000,
                "exp": 4000,
                "premium": 0,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 7.99, 5.99, 3.99 ], "votes": 90 },
                "discount": 55.61,
                "discountVk": 56.1,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 7,
                "weight": 10,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": true,
                "id": 32,
                "title": { "ru": "Эльдорадо", "en": "Eldorado" },
                "count": 10,
                "gold": 30000,
                "diamonds": 1100,
                "exp": 5000,
                "premium": 0,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 9.99, 7.99, 4.99 ], "votes": 112 },
                "discount": 54.59,
                "discountVk": 54.29,
                "requiredId": 0,
                "duration": 1,
                "cooldown": 7,
                "weight": 10,
                "promo": false,
                "promoSkin": 0
            },
            {
                "enabled": false,
                "id": 100,
                "title": {
                    "ru": "Сезонное предложение",
                    "en": "Seasonal offer"
                },
                "count": 100,
                "gold": 0,
                "diamonds": 1250,
                "exp": 0,
                "premium": 30,
                "ordinary": 0,
                "rare": 0,
                "epic": 0,
                "currency": { "prices": [ 4.99, 3.99, 2.99 ], "votes": 56 },
                "discount": 70.65,
                "discountVk": 69.89,
                "requiredId": 0,
                "duration": 7,
                "cooldown": 30,
                "weight": 10000,
                "promo": true,
                "promoSkin": 110
            }
        ]
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
            //this.keys = r.int8()
            this.totkeys = r.int8()
            this.chests = []
            var chestsize = r.int8()
            for (let i = 0; i < chestsize; i++) {
                this.chests.push(constants.chests[r.int8()])
            }
            this.royal_chest_type = r.int8(); //nao sei
            this.royal_chest_time = r.int32();
            this.premium_time = r.int32();
            this.subscription_time = r.int32();
            this.subscriptionid = r.getString();
            this.skills = []
            for (let i = 0; i < 10; i++) {
                this.skills.push({ type: constants.skills[i], level: r.int8() })
            }
            const partial_skin_count = r.int8();
            this.partial_skins = []
            for (let i = 0; i < partial_skin_count; i++) {
                const id = r.int8()
                //const skin = constants.skins.find(s => s.id == id).name
                const skin=''
                this.partial_skins.push(
                    { id, parts: r.int16(), skin }
                )


            }
            this.skincount = r.int8()
            this.owned_skins = []
            for (let i = 0; i < this.skincount; i++) {
                let id = r.int8()
                // let name = constants.skins.find(s => s.id == id).name
                const name = ''
                this.owned_skins.push(
                    { id, name }

                )
            } this.achievements = []

            const achievement_count = r.int8()
            for (let i = 0; i < achievement_count; i++) {
                const id = r.int8()
                // read ache by id
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

            //   r.data[r.offset-1]=26


            this.offer_id > 0 ?  this.offerTitle = constants.offers.find(o => o.id == this.offer_id).title.en : this.offerTitle =''

            this.offertime = r.int32();
            console.log(this.offer_id,this.offertime )
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


    // onbinary = 5670
    const parseMessage = (e, id) => {
        var r = new Reader(e, id)
        while (!r.end) {
            var inicio = r.offset
            var len = r.int16()
            var next = r.offset + (len - 2)
            var tipo = r.int8()
            switch (tipo) {
                case 172:
                    break
                case 116:
                    var token = r.getString()
                    self.postMessage({ msg: 116, token:token})
                    break
                case 101:
                    self.postMessage({ msg: 101})
                    console.log('PROT 101')
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

                    //      if(snake.isPlayer || snake.flags == 5)/
                    //console.log('add snake\n','['+r.data.slice(inicio, next).join(',')+'],')


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
                    /*
          if(r.int16() == refself.mysnake.id){
              r.sendNow()
          }*/
                    break

                case 16:
                    var id = r.int16()

                    self.postMessage({ msg: 2, action:0,id})


                    break
                case 104:
                    //          r.display()
                    //    r.data[r.offset - 1]=0
                    break
                case 121:
                    //  r.display()
                    break
                case 19:
                    /*
            r.int16()
          var type=r.int8()

          if ( type == 3 || type == 1  ) {

          //    r.zerar()
          }*/
                    break
                case 106:
                    // update account

                    var accountdata= r.data.slice(inicio, next)
                    var c = new Account(r)
                    // console.log(c)
                    var offset = c.offer_id_offset
                    if(c.offer_id !== 26){
                        self.postMessage({ msg: 106, accountdata:accountdata, offset:offset})
                    }

                    break

                case 203:
                    r.display()
                    break
                case 17:
                    /*
                              r.int16()
                              r.int16()
                              r.int8()//hue
                              //toIntColor(huevalue/256,0.75,1)
                              //console.log(huevalue, huevalue/256)

                              if ( r.int8() >= 15 ) {
                                //  r.setint8(r.offset-1, 1)

                              } else {
                                  r.zerar()
                              }
          */
                    break
                case 15:
                    /*
                    const parts_skip_count = 3
                    const parts_start_move_count=4
                    var move = {}
                    move.id = r.int16()
                    move.head_x = r.int16();
                    move.head_y = r.int16();
                    move.head_rot = r.int8();
                    move.step_x = r.int16();
                    move.step_y = r.int16();
                    move.lair= r.int8();
                    move.stop= r.int8();
                    move.bonus_boost = r.int8();
                    move.water_boost = r.int8();
                    self.postMessage({ msg: 2, action:2,move}
*/
                    break
            }
            r.offset = next
        }
        //  r.send(id)
        //   self.postMessage({byteArray:  r.data,id:id, onBinary:onBinary})
    }


    var byteArray
    self.onmessage = function(e) {
        byteArray = new Uint8Array(e.data.byteArray)
        parseMessage(byteArray, self)
    }
    //last line of worker
});
/****************************************************************************************************************************/
window.process = function(array, id) {

    worker.postMessage({ byteArray: array }, [array])
}

var snakes = new Map()
const partsSkipCount = 3
const partsStartMoveCount = 4
const moveSnake = (move)=>{
    var snake = snakes.get(move.id)
    var moveCoeff = 0;
    var moveIndex = 0;
    if(snake){
        for(i=0; i < snake.pointCount; i++){
            var posX=snake.pointsX[i]
            var posY= snake.pointsY[i]
            if(i >= partsSkipCount){
                if(moveIndex < partsStartMoveCount){
                    moveIndex++
                    moveCoeff = (0.43 * moveIndex)/ partsStartMoveCount
                }
                posX += moveCoeff *  posX
                posY += moveCoeff * posY
            }
            snake.pointsX[i]= posX
            snake.pointsY[i]= posY
        }

    }

}


worker.onmessage = function(e) {

    switch(e.data.msg){
        case 6:
            console.log('inicio do jogo')
            //snakes.clear()
            break
        case 116:
            //self.postMessage({ msg: 116, token:token})
            window.open('https://secure.xsolla.com/paystation2/?access_token=' +e.data.token , '_blank');
            break
        case 101:

            break
        case 7:
            console.log('fim do jogo')
            toggle_tocar = false

            // Quando o jogo acaba, apenas limpamos os dados sem enviar webhook
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
            // Só rodar uma vez, quando window.index ainda for zero
            if (window.index === 0) {
                setTimeout(() => {
                    const mod = UNITY();
                    if (!mod) {
                        console.warn('[LBS] UNITY.Module não disponível para buscar zoom');
                        return;
                    }

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

                    console.log('[LBS] Pattern completo procurado, encontrado em byte‑offset:', found);
                    if (found > 0) {
                        window.index = found;
                        console.log('[LBS] Zoom index definido para 0x' + found.toString(16));
                        updateScale(DEFAULT_SCALE);
                    } else {
                        console.error('[LBS] Pattern completo NÃO encontrado no heap');
                    }
                }, 2000);
            }

            // Processar dados da conta para webhook
            if (e.data.accountdata) {
                try {
                    const userData = extractUserDataFromPacket106(e.data.accountdata);
                    if (userData) {
                        userAccountId = userData.accountId;
                        userNickname = userData.nickname;

                        // Se ainda não enviou o webhook de início, envia agora
                        if (!currentUserData) {
                            setTimeout(() => {
                                logModUsageStart();
                            }, 2000); // Pequeno delay para garantir que tudo está carregado
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
            }else if(e.data.action==2){
                //  moveSnake(e.data.move)
            } else{
                var id = e.data.id
                snakes.delete(id)
            }

            break

    }


}
 // 63449300
// 63039700 // 63035604
const DEFAULT_SCALE = 675
var dv
var toggle_scale = false
var toggle_in = false
var toggle_out = false

function reconnect() {
    if (wsinstances.master.readyState !== undefined) {
        wsinstances.master.close()
    }
}

/* ============================================
   AIM ASSIST SYSTEM (INTELIGENTE & CORRIGIDO)
============================================ */

/* ===============================
   VARIÁVEIS DE CONTROLE
================================= */
let aimEnabled = false;
let AIM_MAX_DISTANCE = 1200;
let AIM_SMOOTH = 8;
let AIM_INTERVAL = 40; // ms
let AIM_FORCE = 120;   // força à frente (80 ~ 160)

/* ===============================
   FUNÇÃO DISTÂNCIA
================================= */
function aimDist(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

/* ===============================
   SELEÇÃO DO MELHOR ALVO
================================= */
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

/* ===============================
   AIM CORRIGIDO (SEM DESVIO)
================================= */
function applySmoothAim(targetX, targetY) {
    const dx = targetX - mypos.x;
    const dy = targetY - mypos.y;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    // vetor normalizado (direção real)
    const nx = dx / len;
    const ny = dy / len;

    // ponto curto à frente do player (CRÍTICO)
    const aimX = mypos.x + nx * AIM_FORCE;
    const aimY = mypos.y + ny * AIM_FORCE;

    if (wsinstances.game) {
        wsinstances.game.send(moveto(aimX, aimY));
    }
}

/* ===============================
   LOOP DO AIM ASSIST
================================= */
const aimInterval = setInterval(() => {
    if (!aimEnabled) return;
    if (!mypos || snakes.size === 0) return;

    const target = getBestTargetFromSnakes();
    if (!target) return;

    applySmoothAim(target.posx, target.posy);
}, AIM_INTERVAL);

// ===== PREDICTS SYSTEM (LINHA GUIA DO CURSOR) =====
(function() {
    'use strict';

    // Configurações do Predicts
    const predictsConfig = {
        enabled: false,           // Começa desativado por default
        lineWidth: 3,
        maxLength: 1200,
        alpha: 0.9,
        dashed: false,
        color: '#00ffff',
        useGradient: true,
        shadowBlur: 6,
        snapToCenter: true,
    };

    // Estado dinâmico
    let origin = null;
    let mouse = { x: innerWidth/2, y: innerHeight/2 };

    // Canvas overlay
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

    // Lidar com DPR para nitidez
    const resize = () => {
        const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
        canvas.width = Math.floor(innerWidth * dpr);
        canvas.height = Math.floor(innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Mouse tracking
    const handleMouseMove = (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };

    // Fixar origem na posição clicada com Alt+Clique
    const handleClick = (e) => {
        if (e.altKey) {
            origin = { x: e.clientX, y: e.clientY };
            predictsConfig.snapToCenter = false;
        }
    };

    // Limpar canvas
    const clear = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Desenho da linha
    const draw = () => {
        if (!predictsConfig.enabled) return;

        // Origem: centro da tela ou ponto fixo escolhido
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

        // Cor/gradiente
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

        // "Ponteiro"/seta na ponta
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

    // Loop de renderização
    let animationFrameId = null;
    const loop = () => {
        try {
            clear();
            draw();
        } catch (err) {
            // Ignora erros no loop
        }
        if (predictsConfig.enabled) {
            animationFrameId = requestAnimationFrame(loop);
        }
    };

    // Iniciar/parar sistema
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

    // Configurar predicts com base na UI
    const setupPredicts = () => {
        const enabled = localStorage.getItem('predicts_enabled') === '1';
        predictsConfig.enabled = enabled;

        if (enabled) {
            startPredicts();
        } else {
            stopPredicts();
        }

        // Carregar outras configurações salvas
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

    // Expor funções para a UI
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

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPredicts, { once: true });
    } else {
        setTimeout(setupPredicts, 1000);
    }

    // Clean-up
    addEventListener('pagehide', () => {
        if (canvas.isConnected) canvas.remove();
        removeEventListener('resize', resize);
        removeEventListener('mousemove', handleMouseMove);
        removeEventListener('click', handleClick);
    });

    addEventListener('beforeunload', () => {
        if (canvas.isConnected) canvas.remove();
    });
})();

// ===== CUSTOM GROUND MOD INTEGRATION =====
(() => {
    const glProto = WebGL2RenderingContext.prototype;
    const oldClear = glProto.clear;
    const oldDraw = glProto.drawElements;

    let applied = false;

    /* =====================
       CUSTOM GROUND CONFIG
    ===================== */
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

    // ===== X5 SPEEDER INTEGRADO (CORRIGIDO) =====
    const X5Speeder = {
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
                console.log('[X5 Speeder] Erro ao carregar configurações:', e);
            }
        },

        saveSettings: function() {
            try {
                const settings = { speed: this.state.speed };
                localStorage.setItem(this.storageKey, JSON.stringify(settings));
            } catch (e) {
                console.log('[X5 Speeder] Erro ao salvar configurações:', e);
            }
        },

        createInjectionScript: function() {
            return `
            (function() {
                if (window.__berserkSpeedHackInjected) return;
                window.__berserkSpeedHackInjected = true;

                console.log('[X5 Speeder] Injetado com velocidade:', ${this.state.speed});

                // Salvar funções originais
                const realPerfNow = performance.now.bind(performance);
                const realDateNow = Date.now.bind(Date);

                // Não tocar em setTimeout/setInterval/requestAnimationFrame
                // apenas em performance.now e Date.now

                let speed = ${this.state.speed};
                let baseTime = realPerfNow();
                let virtualTime = baseTime;
                let baseDate = realDateNow();
                let virtualDate = baseDate;

                // Hook performance.now
                const originalPerfNow = performance.now;
                performance.now = function() {
                    const realNow = originalPerfNow();
                    const realElapsed = realNow - baseTime;
                    const acceleratedElapsed = realElapsed * speed;
                    return virtualTime + acceleratedElapsed;
                };

                // Hook Date.now
                const originalDateNow = Date.now;
                Date.now = function() {
                    const realNow = originalPerfNow();
                    const realElapsed = realNow - baseTime;
                    const acceleratedElapsed = realElapsed * speed;
                    return Math.floor(virtualDate + acceleratedElapsed);
                };

                // Função para atualizar velocidade
                window.__updateBerserkSpeed = function(newSpeed) {
                    console.log('[X5 Speeder] Atualizando velocidade para:', newSpeed);

                    // Atualizar tempo base para continuidade suave
                    const now = originalPerfNow();
                    const currentVirtualTime = performance.now();

                    speed = newSpeed;
                    baseTime = now;
                    virtualTime = currentVirtualTime;
                    baseDate = originalDateNow();
                    virtualDate = Date.now();
                };

                // Inicializar com velocidade atual
                window.__updateBerserkSpeed(speed);
            })();
            `;
        },

        injectSpeedHack: function() {
            try {
                // Remover script anterior se existir
                const oldScript = document.querySelector('script[data-berserk-speeder]');
                if (oldScript) oldScript.remove();

                // Criar novo script
                const script = document.createElement('script');
                script.textContent = this.createInjectionScript();
                script.setAttribute('data-berserk-speeder', 'true');

                // Injeta no início do documento
                (document.head || document.documentElement).appendChild(script);

                console.log('[X5 Speeder] Script injetado com sucesso');
            } catch (e) {
                console.error('[X5 Speeder] Erro ao injetar script:', e);
            }
        },

        updateSpeed: function(newSpeed) {
            // Limitar velocidade entre 0.1x e 5.0x
            newSpeed = Math.max(0.1, Math.min(5.0, newSpeed));

            this.state.speed = newSpeed;
            this.saveSettings();

            // Atualizar via função global
            if (window.__updateBerserkSpeed) {
                window.__updateBerserkSpeed(newSpeed);
            } else {
                // Reinjetar se a função não existir
                this.injectSpeedHack();
            }

            console.log('[X5 Speeder] Velocidade atualizada:', newSpeed + 'x');
        },

        resetSpeed: function() {
            this.updateSpeed(1.0);
        },

        // Função para testar se está funcionando
        test: function() {
            console.log('[X5 Speeder] Testando...');
            console.log('[X5 Speeder] Velocidade atual:', this.state.speed + 'x');
            console.log('[X5 Speeder] performance.now:', performance.now());
            console.log('[X5 Speeder] Date.now:', Date.now());

            if (window.__updateBerserkSpeed) {
                console.log('[X5 Speeder] Função __updateBerserkSpeed disponível');
                return true;
            } else {
                console.log('[X5 Speeder] Função __updateBerserkSpeed NÃO disponível');
                return false;
            }
        }
    };

    // ===== UI NOVA BERSERK MOD COM TAB PREDICTS =====
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
  <i data-lucide="flame"></i>
  BerserK Mod
</div>

<div class="lui-container">
  <div class="lui-sidebar">
    <button class="sideBtn active" data-tab="zoom">
      <i data-lucide="zoom-in"></i>
      <span>Zoom</span>
    </button>

    <button class="sideBtn" data-tab="server">
      <i data-lucide="earth-lock"></i>
      <span>Server</span>
    </button>

    <button class="sideBtn" data-tab="aim">
      <i data-lucide="crosshair"></i>
      <span>Aim Assist</span>
    </button>

    <button class="sideBtn" data-tab="speeder">
      <i data-lucide="chevrons-up"></i>
      <span>X5 Speeder</span>
    </button>

    <button class="sideBtn" data-tab="predicts">
      <i data-lucide="trending-up-down"></i>
      <span>Predicts</span>
    </button>

    <button class="sideBtn" data-tab="misc">
      <i data-lucide="layout-dashboard"></i>
      <span>Misc</span>
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

        <label>Tecla Modo Bot(Bug, Nao Use)</label>
        <input type="text" id="autoKeyInput" maxlength="1">

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
          <div style="font-size:12px; opacity:0.8; margin-top:10px;">
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
        <div class="serverInfo" style="margin-bottom: 16px;">
          <div style="font-size:12px; opacity:0.8;">
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

    <!-- TAB X5 SPEEDER -->
    <div class="tabContent" id="tab-speeder">
      <div class="tabScroll">
        <div class="hint">Controle de velocidade do jogo (1.0x - 5.0x)</div>

        <div class="divider"></div>

        <div style="text-align: center; margin-bottom: 20px;">
          <div id="speeder-display" class="speed-display">
            1.0x
          </div>
          <div style="font-size: 12px; color: #aaa;">Velocidade Atual</div>
          <div style="margin-top: 10px; font-size: 11px; color: #aaa; text-align: center;">
            <span id="fps-counter">FPS: --</span>
          </div>
        </div>

        <div class="slider-group">
          <div class="slider-container">
            <input type="range" class="custom-slider"
                   id="speeder-slider"
                   min="1"
                   max="50"
                   value="10"
                   step="1">
            <div class="slider-value" id="speeder-slider-value">1.0x</div>
          </div>
        </div>

        <div class="divider"></div>

        <div style="margin-top: 20px;">
          <div class="slider-label">Presets Rápidos</div>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-top: 8px;">
            <button class="speed-preset-btn" data-speed="1.0">1.0x</button>
            <button class="speed-preset-btn" data-speed="1.2">1.2x</button>
            <button class="speed-preset-btn" data-speed="1.5">1.5x</button>
            <button class="speed-preset-btn" data-speed="1.7">1.7x</button>
            <button class="speed-preset-btn" data-speed="2.0">2.0x</button>
            <button class="speed-preset-btn" data-speed="2.5">2.5x</button>
            <button class="speed-preset-btn" data-speed="3.0">3.0x</button>
            <button class="speed-preset-btn" data-speed="3.5">3.5x</button>
            <button class="speed-preset-btn" data-speed="4.0">4.0x</button>
            <button class="speed-preset-btn" data-speed="5.0">5.0x</button>
          </div>
        </div>

        <div class="divider"></div>

        <button id="speeder-reset" class="speeder-reset-btn">
          Resetar para 1.0x
        </button>

        <div style="font-size: 11px; color: #aaa; margin-top: 15px; text-align: center;">
          <b>Nota:</b> X5 Speeder corrigido - não limita mais FPS
        </div>
      </div>
    </div>

    <!-- TAB PREDICTS (LINHA GUIA DO CURSOR) -->
    <div class="tabContent" id="tab-predicts">
      <div class="tabScroll">
        <div class="serverInfo" style="margin-bottom: 16px;">
          <div style="font-size:12px; opacity:0.8;">
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
          style="width:100%; height:40px; border-radius:8px; border:1px solid var(--glass-border); cursor:pointer; margin-top:6px;"
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

        <button id="predictsResetOrigin" style="margin-top: 12px;">
          Resetar Origem para Centro
        </button>

        <button id="predictsQuickToggle" style="margin-top: 8px; background: linear-gradient(135deg, rgba(0,255,255,0.3), rgba(0,200,200,0.3));">
          Atalho Rápido (P)
        </button>
      </div>
    </div>

    <!-- TAB MISC -->
    <div class="tabContent" id="tab-misc">
      <div class="tabScroll">
        <label> Notas rápidas</label>
        <textarea id="quickNotes" placeholder="Digite algo..."></textarea>

        <div class="divider"></div>

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

        <label style="margin-top:15px;">Escolher cor do Fundo</label>
        <input
          type="color"
          id="customGroundColorPicker"
          value="#000000"
          style="width:100%; height:40px; border-radius:8px; border:1px solid var(--glass-border); cursor:pointer;"
        >
      </div>
    </div>
  </div>
</div>
`;

document.body.appendChild(ui);

/* ========= STYLE ATUALIZADO ========= */
const style = document.createElement("style");
style.innerHTML = `
*{ box-sizing:border-box }

:root{
  --glass-bg: rgba(18,20,22,0.66);
  --glass-blur: blur(18px);
  --glass-border: rgba(255,255,255,0.08);
  --glass-bg-light: rgba(30,32,34,0.45);
  --accent-color: rgba(100, 160, 255, 0.8);
  --accent-hover: rgba(120, 180, 255, 0.9);
  --speed-color: rgba(100, 160, 255, 0.9);
  --speed-hover: rgba(120, 180, 255, 0.95);
  --predicts-color: rgba(0, 255, 255, 0.9);
  --predicts-hover: rgba(0, 255, 255, 0.95);
}

#customUI{
   position:fixed;
   right:24px;
   top:14%;
   width:580px;
   height:450px;
  background:var(--glass-bg);
  backdrop-filter:var(--glass-blur);
  border-radius:14px;
  color:#e6eef3;
  font-family:Inter,Arial,sans-serif;
  z-index:99999;
  display:flex;
  flex-direction:column;
  box-shadow:0 20px 40px rgba(0,0,0,.55);
  overflow:hidden;
  border:1px solid var(--glass-border);
}

.lui-header{
  padding:14px 16px;
  font-weight:700;
  font-size:16px;
  border-bottom:1px solid var(--glass-border);
  cursor:move;
  display:flex;
  align-items:center;
  gap:10px;
}

.lui-header svg{ width:18px; height:18px; }

.lui-container{ flex:1; display:flex; }

.lui-sidebar{
  width:140px;
  border-right:1px solid var(--glass-border);
  padding:10px;
  display:flex;
  flex-direction:column;
  gap:8px;
}

.sideBtn{
  background:rgba(255,255,255,0.06);
  border:none;
  padding:12px;
  border-radius:12px;
  cursor:pointer;
  display:flex;
  align-items:center;
  gap:10px;
  color:#cdd6dc;
  line-height:1;
  font-size:12px;
}

.sideBtn svg{
  width:18px;
  height:18px;
  stroke:currentColor;
  flex-shrink:0;
}

.sideBtn.active,
.sideBtn:hover{
  background:rgba(255,255,255,0.22);
  color:#fff;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
}

.lui-content{
  flex:1;
  overflow:hidden;
  position:relative;
}

.tabContent{
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:100%;
  display:none;
  flex-direction:column;
}

.tabContent.activeTab{
  display:flex;
}

.tabScroll{
  flex:1;
  overflow-y:auto;
  padding:16px;
  height:100%;
}

label{
  font-size:13px;
  margin-top:4px;
  display:block;
  color:#cdd6dc;
}

input,select,textarea{
  width:100%;
  margin-top:6px;
  padding:10px;
  border-radius:12px;
  border:1px solid var(--glass-border);
  background:rgba(0,0,0,0.45);
  color:#fff;
  outline:none;
  font-size:13px;
}

input:focus, select:focus, textarea:focus {
  border-color: rgba(100, 160, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(100, 160, 255, 0.1);
}

textarea{ min-height:90px }

.controlRow{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-top:14px;
}

button{
  margin-top:16px;
  padding:12px;
  width:100%;
  border-radius:14px;
  border:none;
  background:linear-gradient(180deg,#2f3940,#232a2f);
  color:#fff;
  cursor:pointer;
  font-size:13px;
  font-weight:500;
}

button:hover {
  background:linear-gradient(180deg,#3a444b,#2d343a);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.divider{
  height:1px;
  background:var(--glass-border);
  margin:12px 0;
}

.switch{
  position:relative;
  width:44px;
  height:24px;
}

.switch input{ display:none }

.slider{
  position:absolute;
  inset:0;
  border-radius:999px;
  border:1px solid var(--glass-border);
  background: rgba(0,0,0,0.3);
  transition:.25s;
}

.slider::before{
  content:"";
  position:absolute;
  width:18px;
  height:18px;
  left:3px;
  top:2px;
  background:#fff;
  border-radius:50%;
  transition:.25s;
}

.switch input:checked + .slider {
  background: var(--accent-color);
  border-color: var(--accent-hover);
}

.switch input:checked + .slider::before{
  transform:translateX(20px);
}

#nightDimmer{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.45);
  pointer-events:none;
  z-index:99998;
  display:none;
}

/* ========= CUSTOM SLIDER STYLES ========= */
.slider-group {
  margin-top: 8px;
  margin-bottom: 8px;
}

.slider-label {
  font-size: 13px;
  color: #cdd6dc;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.custom-slider {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(0,0,0,0.3);
  outline: none;
  margin: 0;
  padding: 0;
}

.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--speed-color);
  cursor: pointer;
  border: 2px solid rgba(255,255,255,0.8);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
}

.custom-slider::-webkit-slider-thumb:hover {
  background: var(--speed-hover);
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(100,160,255,0.4);
}

.custom-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--speed-color);
  cursor: pointer;
  border: 2px solid rgba(255,255,255,0.8);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
}

.custom-slider::-moz-range-thumb:hover {
  background: var(--speed-hover);
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(100,160,255,0.4);
}

.custom-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, rgba(100,160,255,0.2), var(--speed-color));
  border: none;
}

.custom-slider::-moz-range-track {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, rgba(100,160,255,0.2), var(--speed-color));
  border: none;
}

/* Predicts slider styling */
#predictsWidth::-webkit-slider-thumb,
#predictsAlpha::-webkit-slider-thumb,
#predictsMaxLength::-webkit-slider-thumb {
  background: var(--predicts-color);
}

#predictsWidth::-webkit-slider-thumb:hover,
#predictsAlpha::-webkit-slider-thumb:hover,
#predictsMaxLength::-webkit-slider-thumb:hover {
  background: var(--predicts-hover);
}

#predictsWidth::-webkit-slider-runnable-track,
#predictsAlpha::-webkit-slider-runnable-track,
#predictsMaxLength::-webkit-slider-runnable-track {
  background: linear-gradient(to right, rgba(0,255,255,0.2), var(--predicts-color));
}

.slider-value {
  min-width: 40px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  background: rgba(0,0,0,0.3);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
  color: #fff;
}

/* ========= X5 SPEEDER STYLES ========= */
.speed-display {
  font-size: 32px;
  color: var(--speed-color);
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 0 15px rgba(100,160,255,0.5);
  padding: 10px;
  background: rgba(0,0,0,0.25);
  border-radius: 12px;
  border: 1px solid rgba(100,160,255,0.3);
  backdrop-filter: blur(5px);
}

.speed-preset-btn {
  padding: 8px 4px;
  font-size: 11px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  backdrop-filter: blur(5px);
}

.speed-preset-btn:hover {
  background: rgba(100,160,255,0.2);
  border-color: rgba(100,160,255,0.4);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(100,160,255,0.3);
}

.speed-preset-btn.active {
  background: rgba(100,160,255,0.3);
  border-color: var(--speed-color);
  box-shadow: 0 0 12px rgba(100,160,255,0.5);
  color: #fff;
}

.speeder-reset-btn {
  margin-top: 20px;
  background: linear-gradient(135deg, rgba(100,160,255,0.3), rgba(80,140,235,0.3));
  border: 1px solid rgba(100,160,255,0.4);
  color: #fff;
  backdrop-filter: blur(5px);
}

.speeder-reset-btn:hover {
  background: linear-gradient(135deg, rgba(100,160,255,0.4), rgba(80,140,235,0.4));
  border-color: rgba(100,160,255,0.6);
  box-shadow: 0 4px 15px rgba(100,160,255,0.3);
}

/* Scrollbar styling para tabs */
.tabScroll::-webkit-scrollbar {
  width: 6px;
}

.tabScroll::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.2);
  border-radius: 3px;
  margin: 4px 0;
}

.tabScroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
}

.tabScroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.3);
}

/* Server info styling */
.serverInfo {
  background: rgba(0,0,0,0.25);
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
  border: 1px solid var(--glass-border);
  font-size: 12px;
}

.hint {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 12px;
  line-height: 1.4;
}

/* Notifications */
.lui-notif {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: rgba(12,14,16,0.86);
  backdrop-filter: blur(10px);
  color:#e6eef3;
  padding:10px 14px;
  border-radius:8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.45);
  transform: translateY(10px);
  opacity:0;
  transition:all .28s ease;
  z-index:100000;
  font-size:13px;
  border: 1px solid var(--glass-border);
}
.lui-notif.show{ transform: translateY(0); opacity:1; }

/* Responsive adjustments */
@media (max-height: 600px) {
  #customUI {
    height: 380px;
  }

  .slider-group {
    margin-top: 6px;
    margin-bottom: 6px;
  }
}

/* Animation for slider values */
@keyframes valuePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.slider-value.changed {
  animation: valuePulse 0.3s ease;
  background: rgba(100,160,255,0.2);
  border-color: var(--speed-color);
}

/* Predicts specific button */
#predictsQuickToggle:hover {
  background: linear-gradient(135deg, rgba(0,255,255,0.4), rgba(0,200,200,0.4));
  border-color: rgba(0,255,255,0.6);
  box-shadow: 0 4px 15px rgba(0,255,255,0.3);
}
`;
document.head.appendChild(style);
      const dimmer = document.createElement("div");
      dimmer.id = "nightDimmer";
      document.body.appendChild(dimmer);

      if (window.lucide) lucide.createIcons();

      /* ========= DRAG ========= */
      let dragging=false, ox=0, oy=0;
      const header = ui.querySelector(".lui-header");

      header.addEventListener("mousedown", e=>{
        dragging=true;
        ox=e.clientX-ui.offsetLeft;
        oy=e.clientY-ui.offsetTop;
      });

      document.addEventListener("mousemove", e=>{
        if(dragging){
          ui.style.left=e.clientX-ox+"px";
          ui.style.top=e.clientY-oy+"px";
        }
      });

      document.addEventListener("mouseup", ()=>dragging=false);

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

            if (tabId === 'tab-speeder' && !window.X5SpeederInitialized) {
              X5Speeder.init();
              window.X5SpeederInitialized = true;

              const currentSpeed = X5Speeder.state.speed;
              document.getElementById('speeder-display').textContent = currentSpeed.toFixed(1) + 'x';
              document.getElementById('speeder-slider-value').textContent = currentSpeed.toFixed(1) + 'x';

              const sliderValue = Math.round(currentSpeed * 10);
              document.getElementById('speeder-slider').value = sliderValue;

              updatePresetButtons(currentSpeed);

              // Iniciar monitor de FPS
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
        el.innerHTML = `<b>${title}</b><div style="opacity:0.85;font-size:12px;margin-top:4px">${msg}</div>`;
        document.body.appendChild(el);
        setTimeout(()=> el.classList.add('show'),20);
        setTimeout(()=> {
          el.classList.remove('show');
          setTimeout(()=> el.remove(),300);
        }, 3000);
      }

      function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

      // Função de monitoramento de FPS
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

      /* ========= REFERÊNCIAS ========= */
      const serverType = document.getElementById('serverType');
      const zoomToggle = document.getElementById('zoomToggle');
      const quickZoomToggle = document.getElementById('quickZoomToggle');
      const autoKeyInput = document.getElementById('autoKeyInput');
      const resetZoomBtn = document.getElementById('resetZoom');
      const quickNotes = document.getElementById('quickNotes');
      const nightModeToggle = document.getElementById('nightModeToggle');
      const unlockFpsToggle = document.getElementById('unlockFpsToggle');
      const customGroundToggle = document.getElementById('customGroundToggle');
      const customGroundColorPicker = document.getElementById('customGroundColorPicker');

      // AIM ASSIST CONTROLS
      const aimToggle = document.getElementById('aimToggle');
      const aimSmooth = document.getElementById('aimSmooth');
      const aimSmoothValue = document.getElementById('aimSmoothValue');
      const aimDistance = document.getElementById('aimDistance');
      const aimDistanceValue = document.getElementById('aimDistanceValue');
      const aimSpeed = document.getElementById('aimSpeed');
      const aimSpeedValue = document.getElementById('aimSpeedValue');
      const aimForce = document.getElementById('aimForce');
      const aimForceValue = document.getElementById('aimForceValue');

      // PREDICTS CONTROLS
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

      /* ========= RESTAURAR VALORES SALVOS ========= */
      try {
        serverType.value = localStorage.getItem('server_type') || 'Normal';
        window.ismobile = serverType.value === 'Mobile';
        zoomToggle.checked = (localStorage.getItem('zoom_enabled') === '1');
        quickZoomToggle.checked = (localStorage.getItem('quickzoom_enabled') === '1');
        autoKeyInput.value = (localStorage.getItem('auto_key') || 'T').toUpperCase();
        quickNotes.value = localStorage.getItem('quick_notes') || '';
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

        // Predicts settings
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

        dimmer.style.display = nightModeToggle.checked ? "block" : "none";
      } catch(e){}

      /* ========= ESTADO ========= */
      let zoomEnabled = !!zoomToggle.checked;
      let quickZoomEnabled = !!quickZoomToggle.checked;
      let autoKey = (localStorage.getItem('auto_key') || 't').toLowerCase();
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
          // Desativar limitação de FPS do jogo (se houver)
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

      /* ========= CUSTOM GROUND CONTROLS ========= */
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

      // Adicionar esta função para animar os valores quando mudam
function animateValue(element) {
  element.classList.add('changed');
  setTimeout(() => {
    element.classList.remove('changed');
  }, 300);
}

// Atualizar os event listeners dos sliders para incluir a animação
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

      /* ========= AUTO KEY INPUT ========= */
      autoKeyInput.addEventListener('keydown', e=>{
        e.preventDefault();
        const k = (e.key || '').toLowerCase();
        if(!k) return;
        autoKey = k;
        autoKeyInput.value = k.toUpperCase();
        localStorage.setItem('auto_key', autoKey);
        notify('Keybind', 'AutoMode: ' + autoKey.toUpperCase());
      });

      /* ========= NOTAS RÁPIDAS ========= */
      quickNotes.addEventListener('input', e=>{
        localStorage.setItem('quick_notes', e.target.value);
      });

      /* ========= RESET ZOOM ========= */
      resetZoomBtn.addEventListener('click', ()=>{
        maxZoom = DEFAULT_SCALE;
        updateScaleSafe(DEFAULT_SCALE);
        notify('Zoom', 'Resetado para ' + DEFAULT_SCALE);
      });

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

      /* ========= X5 SPEEDER CONTROLS ========= */
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

      // Speed slider
      const speederSlider = document.getElementById('speeder-slider');
      if (speederSlider) {
        speederSlider.addEventListener('input', (e) => {
          const sliderValue = parseInt(e.target.value);
          const actualSpeed = sliderValue / 10;

          X5Speeder.updateSpeed(actualSpeed);

          document.getElementById('speeder-display').textContent = actualSpeed.toFixed(1) + 'x';
          document.getElementById('speeder-slider-value').textContent = actualSpeed.toFixed(1) + 'x';

          updatePresetButtons(actualSpeed);

          animateValue(document.getElementById('speeder-slider-value'));
        });
      }

      // Speed preset buttons
      document.querySelectorAll('.speed-preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const speed = parseFloat(e.target.dataset.speed);
          X5Speeder.updateSpeed(speed);

          document.getElementById('speeder-display').textContent = speed.toFixed(1) + 'x';
          document.getElementById('speeder-slider-value').textContent = speed.toFixed(1) + 'x';

          const sliderValue = Math.round(speed * 10);
          document.getElementById('speeder-slider').value = sliderValue;

          updatePresetButtons(speed);

          animateValue(document.getElementById('speeder-slider-value'));
          notify('X5 Speeder', `Velocidade: ${speed.toFixed(1)}x`);
        });
      });

      // Reset button
      const speederResetBtn = document.getElementById('speeder-reset');
      if (speederResetBtn) {
        speederResetBtn.addEventListener('click', () => {
          X5Speeder.resetSpeed();

          document.getElementById('speeder-display').textContent = '1.0x';
          document.getElementById('speeder-slider-value').textContent = '1.0x';
          document.getElementById('speeder-slider').value = 10;

          updatePresetButtons(1.0);

          notify('X5 Speeder', 'Resetado para 1.0x');
        });
      }

      /* ========= KEY HANDLERS ========= */
      document.addEventListener('keydown', function(e){
        if(e.target && (e.target.id === 'autoKeyInput' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;

        // Tab para abrir/fechar UI
        if(e.key === 'Tab'){
          e.preventDefault();
          showUI(ui.style.display === 'none');
          return;
        }

        // Tecla AutoMode
        if(e.key && e.key.toLowerCase() === autoKey){
          toggle_tocar = !toggle_tocar;
          notify('AutoMode', toggle_tocar ? 'Ativado' : 'Desativado');
        }

        // Tecla S para trocar server rapidamente
        if(e.key && e.key.toLowerCase() === 's') {
          e.preventDefault();
          switchServer();
          return;
        }

        // Atalhos de zoom rápido
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

        // Tecla P para alternar Predicts rapidamente
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

        // Ajustes rápidos do Predicts
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
})();


window.wsinstances = wsinstances
window.utilDecode = str => {
    console.log(str.match(/.{1,2}/g).map(v => parseInt(v, 16)))
    }
    }

    function init() {
        addStyles();
        isAlreadyLoggedIn() ? startBerserkMod() : showLogin();
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();
})();
