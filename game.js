const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1920;
canvas.height = 1080;
ctx.imageSmoothingEnabled = false;

let gameState = "MENU";
let keys = {};
let showDialogue = false;

const colors = { bg: '#1a0b2e', npc: '#ff66cc' };

// ==========================================
// 1. СИСТЕМА СЦЕН (ЛОКАЦИЙ)
// ==========================================
const scenes = {
    "midgard": {
        bgSrc: 'assets/BACKGROUND.png',
        hasNpc: true,
        npcName: "Страж Врат",
        npcWorldX: 0.7,
        npcWorldY: 0.3,
        dialogueTree: {
            start: {
                text: "Приветствую тебя в Мидгарде, полубогиня. Асгард ждал твоего возвращения.",
                choices: [
                    { text: "Кто ты такой?", next: "who" },
                    { text: "Я ухожу. (Закрыть)", action: "close" }
                ]
            },
            who: {
                text: "Я — Страж Врат, последний из древнего рода.",
                choices: [{ text: "Понятно.", next: "start" }]
            }
        }
    },
    "asgard": {
        bgSrc: 'assets/ASGARD.png', // Твоя новая картинка
        hasNpc: false, // В Асгарде пока нет NPC
        npcName: "",
        npcWorldX: 0,
        npcWorldY: 0,
        dialogueTree: {} // Пустой диалог
    }
};

let currentScene = "midgard"; // С какой локации начинаем

// ==========================================
// ЗАГРУЗКА РЕСУРСОВ
// ==========================================
const heroImage = new Image();
heroImage.src = 'assets/hero.png';
const bgImage = new Image(); // Сюда будет грузиться фон текущей сцены

// ==========================================
// АДАПТИВНАЯ МАТЕМАТИКА
// ==========================================
const RATIO_FLOOR_TOP_Y = 500 / 1080;
const RATIO_FLOOR_BOTTOM_Y = 1115 / 1080;
const RATIO_FLOOR_TOP_W = 1360 / 1730;
const RATIO_FLOOR_BOTTOM_W = 1.0;

const player = {
    worldX: 0.5, worldY: 0.5, w: 80, h: 80, speed: 0.006,
    direction: 'down', frame: 1, animTimer: 0, screenX: 0, screenY: 0, scale: 1
};

const npc = {
    worldX: 0, worldY: 0, w: 80, h: 80, color: colors.npc, name: "",
    screenX: 0, screenY: 0, scale: 1, dialogueTree: {}
};

let entities = [player, npc];

// ==========================================
// ФУНКЦИЯ ЗАГРУЗКИ СЦЕНЫ
// ==========================================
function loadScene(sceneId) {
    currentScene = sceneId;
    let sceneData = scenes[sceneId];

    // 1. Меняем фон
    bgImage.src = sceneData.bgSrc;

    // 2. Настраиваем NPC
    if (sceneData.hasNpc) {
        npc.worldX = sceneData.npcWorldX;
        npc.worldY = sceneData.npcWorldY;
        npc.name = sceneData.npcName;
        npc.dialogueTree = sceneData.dialogueTree;
        if (!entities.includes(npc)) entities.push(npc); // Добавляем в список отрисовки
    } else {
        entities = entities.filter(e => e !== npc); // Убираем NPC из списка
    }

    // 3. Сбрасываем позицию игрока
    player.worldX = 0.5;
    player.worldY = 0.5;

    // 4. Пересчитываем и закрываем меню
    updatePlayerPosition();
    updateNpcPosition();
    closeDialogue();
    gameState = "PLAYING";
    showMenu(null);
}

// ==========================================
// ПОЗИЦИИ
// ==========================================
function updatePlayerPosition() {
    let currentTopY = canvas.height * RATIO_FLOOR_TOP_Y;
    let currentBottomY = canvas.height * RATIO_FLOOR_BOTTOM_Y;
    let currentTopW = canvas.width * RATIO_FLOOR_TOP_W;
    let currentBottomW = canvas.width * RATIO_FLOOR_BOTTOM_W;

    player.screenY = currentTopY + (currentBottomY - currentTopY) * player.worldY;
    let currentWidth = currentTopW + (currentBottomW - currentTopW) * player.worldY;
    player.screenX = (canvas.width / 2) - (currentWidth / 2) + (currentWidth * player.worldX);
    player.scale = 0.5 + (0.7 * player.worldY);
}

function updateNpcPosition() {
    let currentTopY = canvas.height * RATIO_FLOOR_TOP_Y;
    let currentBottomY = canvas.height * RATIO_FLOOR_BOTTOM_Y;
    let currentTopW = canvas.width * RATIO_FLOOR_TOP_W;
    let currentBottomW = canvas.width * RATIO_FLOOR_BOTTOM_W;

    npc.screenY = currentTopY + (currentBottomY - currentTopY) * npc.worldY;
    let currentWidth = currentTopW + (currentBottomW - currentTopW) * npc.worldY;
    npc.screenX = (canvas.width / 2) - (currentWidth / 2) + (currentWidth * npc.worldX);
    npc.scale = 0.5 + (0.7 * npc.worldY);
}

// ==========================================
// ИНТЕРФЕЙС
// ==========================================
function showMenu(menuId) {
    document.querySelectorAll('.ui-overlay').forEach(el => el.style.display = 'none');
    if (menuId) document.getElementById(menuId).style.display = 'flex';
}

window.addEventListener('DOMContentLoaded', () => {

    document.getElementById('btn-start').onclick = () => {
        loadScene("midgard"); // При старте грузим Мидгард
    };

    document.getElementById('btn-exit').onclick = () => {
        if (window.pywebview && window.pywebview.api) window.pywebview.api.close_window();
        else window.close();
    };

    document.getElementById('btn-settings').onclick = () => showMenu('settings-menu');
    document.getElementById('btn-back-settings').onclick = () => showMenu('main-menu');

    document.getElementById('btn-fullscreen').onclick = () => {
        if (window.pywebview && window.pywebview.api) window.pywebview.api.toggle_fullscreen();
    };

    const changeRes = (w, h) => {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = false;
        updatePlayerPosition();
        updateNpcPosition();
        if (window.pywebview && window.pywebview.api) {
            window.pywebview.api.set_window_size(w, h);
        }
    };

    document.getElementById('res-720').onclick = () => changeRes(1280, 720);
    document.getElementById('res-1080').onclick = () => changeRes(1920, 1080);
    document.getElementById('res-4k').onclick = () => changeRes(3840, 2160);

    document.getElementById('btn-resume').onclick = () => { gameState = "PLAYING"; showMenu(null); };
    document.getElementById('btn-to-main').onclick = () => { gameState = "MENU"; showMenu('main-menu'); };
    document.getElementById('btn-open-map').onclick = () => { gameState = "MAP"; showMenu('map-overlay'); };

    // КЛИКИ ПО КАРТЕ
    document.getElementById('map-midgard').onclick = () => {
        loadScene("midgard");
    };

    document.getElementById('map-asgard').onclick = () => {
        loadScene("asgard");
    };
});

// ==========================================
// УПРАВЛЕНИЕ
// ==========================================
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
        if (window.pywebview && window.pywebview.api) window.pywebview.api.toggle_fullscreen();
    }

    if (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'ь') {
        if (gameState === "PLAYING") { gameState = "MAP"; showMenu('map-overlay'); }
        else if (gameState === "MAP") { gameState = "PLAYING"; showMenu(null); }
    }

    if (e.key === 'Escape') {
        if (gameState === "PLAYING") { gameState = "PAUSED"; showMenu('pause-menu'); }
        else if (gameState === "PAUSED") { gameState = "PLAYING"; showMenu(null); }
        else if (gameState === "MAP") { gameState = "PLAYING"; showMenu(null); }
    }

    // Взаимодействие только если в сцене есть NPC
    if ((e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'у') && gameState === "PLAYING" && !showDialogue && scenes[currentScene].hasNpc) {
        let dx = player.screenX - npc.screenX;
        let dy = player.screenY - npc.screenY;
        if (Math.sqrt(dx*dx + dy*dy) < 200) openDialogue(npc);
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// ==========================================
// ДИАЛОГИ
// ==========================================
function openDialogue(npcObj) {
    showDialogue = true;
    document.getElementById('dialogue-box').style.display = 'block';
    document.getElementById('dialogue-choices').style.display = 'flex';
    renderDialogueNode(npcObj, "start");
}

function renderDialogueNode(npcObj, nodeId) {
    let node = npcObj.dialogueTree[nodeId];
    document.getElementById('npc-name').textContent = npcObj.name;
    document.getElementById('npc-text').textContent = node.text;
    const choicesContainer = document.getElementById('dialogue-choices');
    choicesContainer.innerHTML = '';

    node.choices.forEach(choice => {
        let btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.onclick = () => {
            if (choice.action === 'close') closeDialogue();
            else if (choice.next) renderDialogueNode(npcObj, choice.next);
        };
        choicesContainer.appendChild(btn);
    });
}

function closeDialogue() {
    showDialogue = false;
    document.getElementById('dialogue-box').style.display = 'none';
    document.getElementById('dialogue-choices').style.display = 'none';
}

// ==========================================
// ДВИЖЕНИЕ И ОТРИСОВКА
// ==========================================
function updatePlayer() {
    if (showDialogue) return;
    let dx = 0, dy = 0, isMoving = false;

    if (keys['w'] || keys['arrowup'] || keys['ц']) { dy -= 1; }
    if (keys['s'] || keys['arrowdown'] || keys['ы']) { dy += 1; }
    if (keys['a'] || keys['arrowleft'] || keys['ф']) { dx -= 1; }
    if (keys['d'] || keys['arrowright'] || keys['в']) { dx += 1; }

    if (dx !== 0 || dy !== 0) {
        isMoving = true;
        if (dx < 0) player.direction = 'left';
        else if (dx > 0) player.direction = 'right';
        else if (dy < 0) player.direction = 'up';
        else if (dy > 0) player.direction = 'down';

        let length = Math.sqrt(dx*dx + dy*dy);
        player.worldX += (dx / length) * player.speed;
        player.worldY += (dy / length) * player.speed;

        if (player.worldX < 0.0) player.worldX = 0.0;
        if (player.worldX > 1.0) player.worldX = 1.0;
        if (player.worldY < 0.0) player.worldY = 0.0;
        if (player.worldY > 0.95) player.worldY = 0.95;
    }

    if (isMoving) {
        player.animTimer++;
        if (player.animTimer > 10) { player.frame = (player.frame + 1) % 3; player.animTimer = 0; }
    } else { player.frame = 1; }
    updatePlayerPosition();
}

function draw() {
    if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (scenes[currentScene].hasNpc) updateNpcPosition();

    entities.sort((a, b) => a.screenY - b.screenY);

    for (let entity of entities) {
        if (entity === npc && scenes[currentScene].hasNpc) {
            let nw = npc.w * npc.scale; let nh = npc.h * npc.scale;
            ctx.fillStyle = npc.color; ctx.fillRect(npc.screenX - nw/2, npc.screenY - nh, nw, nh);
            let dx = player.screenX - npc.screenX; let dy = player.screenY - npc.screenY;
            if (Math.sqrt(dx*dx + dy*dy) < 200 && !showDialogue) {
                ctx.fillStyle = '#fff'; ctx.font = `bold ${30 * npc.scale}px Arial`;
                ctx.fillText('!', npc.screenX - 5, npc.screenY - nh - 20);
            }
        }
        if (entity === player) {
            if (heroImage.complete && heroImage.naturalWidth > 0) {
                let frameWidth = Math.floor(147 / 3);
                let frameHeight = Math.floor(194 / 4);
                let row = 0;
                if (player.direction === 'left') row = 1;
                if (player.direction === 'right') row = 2;
                if (player.direction === 'up') row = 3;
                let sx = Math.floor(player.frame * frameWidth);
                let sy = Math.floor(row * frameHeight);
                let drawW = 192 * player.scale; let drawH = 192 * player.scale;
                ctx.drawImage(heroImage, sx, sy, frameWidth, frameHeight, player.screenX - drawW/2, player.screenY - drawH, drawW, drawH);
            }
        }
    }
}

function gameLoop() {
    if (gameState === "PLAYING") updatePlayer();
    draw();
    requestAnimationFrame(gameLoop);
}

// Инициализация (загружаем первую сцену при запуске)
loadScene("midgard");
gameLoop();