// ==========================================
// НАСТРОЙКИ ИГРЫ
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1920;
canvas.height = 1080;
ctx.imageSmoothingEnabled = false;

const colors = { bg: '#1a0b2e', npc: '#ff66cc' };

// СОСТОЯНИЕ ИГРЫ: "MENU", "PLAYING", "PAUSED"
let gameState = "MENU";
let keys = {};
let showDialogue = false;

// ==========================================
// ЗАГРУЗКА КАРТИНОК
// ==========================================
const heroImage = new Image();
heroImage.src = 'assets/hero.png';
const bgImage = new Image();
bgImage.src = 'assets/BACKGROUND.png';

// ==========================================
// НАСТРОЙКИ ПЕРСПЕКТИВЫ
// ==========================================
const FLOOR_TOP_Y = 500;
const FLOOR_BOTTOM_Y = 1040;
const FLOOR_TOP_WIDTH = 1440;
const FLOOR_BOTTOM_WIDTH = 1920;

// ==========================================
// ИГРОВЫЕ ОБЪЕКТЫ
// ==========================================
const player = {
    worldX: 0.5, worldY: 0.5, w: 80, h: 80, speed: 0.006,
    direction: 'down', frame: 1, animTimer: 0, screenX: 0, screenY: 0, scale: 1
};

function updatePlayerPosition() {
    player.screenY = FLOOR_TOP_Y + (FLOOR_BOTTOM_Y - FLOOR_TOP_Y) * player.worldY;
    let currentWidth = FLOOR_TOP_WIDTH + (FLOOR_BOTTOM_WIDTH - FLOOR_TOP_WIDTH) * player.worldY;
    player.screenX = (canvas.width / 2) - (currentWidth / 2) + (currentWidth * player.worldX);
    player.scale = 0.5 + (0.7 * player.worldY);
}

const npc = {
    worldX: 0.7, worldY: 0.3, w: 80, h: 80, color: colors.npc, name: "Страж Врат",
    screenX: 0, screenY: 0, scale: 1,
    dialogueTree: {
        start: {
            text: "Приветствую тебя, полубогиня. Асгард ждал твоего возвращения. Игдрасиль в опасности...",
            choices: [
                { text: "Кто ты такой?", next: "who" },
                { text: "Что случилось с Игдрасилем?", next: "tree" },
                { text: "Я ухожу. (Закрыть)", action: "close" }
            ]
        },
        who: {
            text: "Я — Страж Врат, последний из древнего рода. Я охраняю вход в этот зал уже тысячу лет.",
            choices: [
                { text: "Понятно. Что мне делать?", next: "start" },
                { text: "Я ухожу. (Закрыть)", action: "close" }
            ]
        },
        tree: {
            text: "Тьма поглощает корни Древа. Если мы не остановим это, все девять миров падут.",
            choices: [
                { text: "Как мне помочь?", next: "start" },
                { text: "Я ухожу. (Закрыть)", action: "close" }
            ]
        }
    }
};

function updateNpcPosition() {
    npc.screenY = FLOOR_TOP_Y + (FLOOR_BOTTOM_Y - FLOOR_TOP_Y) * npc.worldY;
    let currentWidth = FLOOR_TOP_WIDTH + (FLOOR_BOTTOM_WIDTH - FLOOR_TOP_WIDTH) * npc.worldY;
    npc.screenX = (canvas.width / 2) - (currentWidth / 2) + (currentWidth * npc.worldX);
    npc.scale = 0.5 + (0.7 * npc.worldY);
}

let entities = [player, npc];

// ==========================================
// СИСТЕМА МЕНЮ (КНОПКИ)
// ==========================================
function showMenu(menuId) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';

    if (menuId) {
        document.getElementById(menuId).style.display = 'flex';
    }
}

document.getElementById('btn-start').addEventListener('click', () => {
    gameState = "PLAYING";
    showMenu(null); // Прячем все меню
});

document.getElementById('btn-resume').addEventListener('click', () => {
    gameState = "PLAYING";
    showMenu(null);
});

document.getElementById('btn-to-main').addEventListener('click', () => {
    gameState = "MENU";
    showMenu('main-menu');
});

document.getElementById('btn-exit').addEventListener('click', () => {
    // Если запущено в PyWebView, закрываем окно
    if (window.pywebview && window.pywebview.api) {
        window.pywebview.api.toggle_fullscreen(); // Или другая команда для выхода
    }
    window.close(); // Закрывает вкладку в браузере
});

// ==========================================
// УПРАВЛЕНИЕ
// ==========================================
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Открытие/закрытие паузы на Esc
    if (e.key === 'Escape' && gameState === "PLAYING") {
        gameState = "PAUSED";
        showMenu('pause-menu');
    } else if (e.key === 'Escape' && gameState === "PAUSED") {
        gameState = "PLAYING";
        showMenu(null);
    }

    // Взаимодействие (только если играем и диалог закрыт)
    if ((e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'у') && gameState === "PLAYING" && !showDialogue) {
        let dx = player.screenX - npc.screenX;
        let dy = player.screenY - npc.screenY;
        if (Math.sqrt(dx*dx + dy*dy) < 200) {
            openDialogue(npc);
        }
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// ==========================================
// ЛОГИКА ДИАЛОГОВ (Без изменений)
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
// ЛОГИКА ДВИЖЕНИЯ (Без изменений)
// ==========================================
function updatePlayer() {
    // Если диалог открыт — не двигаемся
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
        if (player.animTimer > 10) {
            player.frame = (player.frame + 1) % 3;
            player.animTimer = 0;
        }
    } else {
        player.frame = 1;
    }
    updatePlayerPosition();
}

// ==========================================
// ОТРИСОВКА (Render)
// ==========================================
function draw() {
    if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    updateNpcPosition();
    entities.sort((a, b) => a.screenY - b.screenY);

    for (let entity of entities) {
        if (entity === npc) {
            let nw = npc.w * npc.scale;
            let nh = npc.h * npc.scale;
            ctx.fillStyle = npc.color;
            ctx.fillRect(npc.screenX - nw/2, npc.screenY - nh, nw, nh);

            let dx = player.screenX - npc.screenX;
            let dy = player.screenY - npc.screenY;
            if (Math.sqrt(dx*dx + dy*dy) < 200 && !showDialogue) {
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${30 * npc.scale}px Arial`;
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
                let drawW = 192 * player.scale;
                let drawH = 192 * player.scale;

                ctx.drawImage(heroImage, sx, sy, frameWidth, frameHeight,
                    player.screenX - drawW/2, player.screenY - drawH, drawW, drawH);
            }
        }
    }
}

// ==========================================
// ИГРОВОЙ ЦИКЛ (С проверкой состояния)
// ==========================================
function gameLoop() {
    // Обновляем игру ТОЛЬКО если мы играем (не в меню и не на паузе)
    if (gameState === "PLAYING") {
        updatePlayer();
    }

    // Рисуем мир ВСЕГДА (чтобы на фоне меню была видна игра)
    draw();

    requestAnimationFrame(gameLoop);
}

// Старт
updatePlayerPosition();
gameLoop();