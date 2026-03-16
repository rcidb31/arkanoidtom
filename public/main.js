/*////////////////////////// CANVAS //////////////////////////////*/

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Dimensiones base del juego
const BASE_WIDTH = 448;
const BASE_HEIGHT = 400;

// Configurar canvas responsive
function setupCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(window.innerWidth - 20, BASE_WIDTH);
    const scale = maxWidth / BASE_WIDTH;

    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;
    canvas.style.width = `${BASE_WIDTH * scale}px`;
    canvas.style.height = `${BASE_HEIGHT * scale}px`;

    return scale;
}

let canvasScale = setupCanvas();

window.addEventListener('resize', () => {
    canvasScale = setupCanvas();
});

/*////////////////////////// NIVELES //////////////////////////////*/

const LEVELS = [
    {
        speed: 2,
        paddleWidth: 50,
        pattern: 'full',
    },
    {
        speed: 2.8,
        paddleWidth: 45,
        pattern: 'checker',
    },
    {
        speed: 3.5,
        paddleWidth: 40,
        pattern: 'diamond',
    }
];

let currentLevel = 1;

/*////////////////////////// ESTADO DEL JUEGO //////////////////////////////*/

let score = 0;
let lives = 3;
let gameOver = false;
let gameWon = false;
let gamePaused = true; // Empieza pausado para que el usuario inicie

/*////////////////////////// TRANSICIÓN DE NIVEL //////////////////////////////*/

let levelTransition = { active: false, timer: 0, targetLevel: 0 };

/*////////////////////////// PARTÍCULAS //////////////////////////////*/

let particles = [];

// Colores mapeados a los sprites de ladrillos (8 colores)
const BRICK_COLORS = [
    '#e74c3c', // 1 - rojo
    '#e67e22', // 2 - naranja
    '#f1c40f', // 3 - amarillo
    '#2ecc71', // 4 - verde
    '#3498db', // 5 - azul
    '#9b59b6', // 6 - púrpura
    '#1abc9c', // 7 - turquesa
    '#ecf0f1', // 8 - blanco
];

function spawnParticles(brickX, brickY, brickW, brickH, colorIndex) {
    const color = BRICK_COLORS[(colorIndex - 1) % BRICK_COLORS.length];
    const count = 6 + Math.floor(Math.random() * 3); // 6-8 partículas
    for (let i = 0; i < count; i++) {
        particles.push({
            x: brickX + brickW / 2 + (Math.random() - 0.5) * brickW,
            y: brickY + brickH / 2 + (Math.random() - 0.5) * brickH,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4 - 1,
            color: color,
            life: 1.0,
            size: 2 + Math.random() * 3,
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.05; // gravedad leve
        p.life -= 0.025;
        p.size *= 0.98;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

/*////////////////////////// TRAIL DE PELOTA //////////////////////////////*/

let ballTrail = [];
const TRAIL_LENGTH = 10;

/*////////////////////////// SPRITE //////////////////////////////*/
const $sprite = document.querySelector('#sprite');
const $bricks = document.querySelector('#bricks');

/*////////////////////////// PALA //////////////////////////////*/

const paddleHeight = 10;
let paddleWidth = LEVELS[0].paddleWidth;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight;
let rightPressed = false;
let leftPressed = false;
const paddleSensitive = 8;

// Animación de la pala
let prevPaddleX = paddleX;
let paddleTilt = 0;
let paddleSquash = 0;

function drawPaddle() {
    const targetTilt = (paddleX - prevPaddleX) * 0.02;
    paddleTilt = paddleTilt * 0.85 + targetTilt * 0.15;
    // Limitar ángulo máximo a ~8 grados
    paddleTilt = Math.max(-0.14, Math.min(0.14, paddleTilt));

    paddleSquash *= 0.9;

    ctx.save();
    ctx.translate(paddleX + paddleWidth / 2, paddleY + paddleHeight / 2);
    ctx.rotate(paddleTilt);
    ctx.scale(1 + paddleSquash * 0.2, 1 - paddleSquash * 0.2);

    ctx.drawImage(
        $sprite,
        28,
        173,
        50, // sprite source width siempre 50
        paddleHeight,
        -paddleWidth / 2,
        -paddleHeight / 2,
        paddleWidth,
        paddleHeight
    );

    ctx.restore();

    prevPaddleX = paddleX;
}

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
    // Iniciar juego con cualquier tecla
    if (gamePaused && !gameOver && !gameWon && !levelTransition.active) {
        gamePaused = false;
        if (typeof updateStartButton === 'function') updateStartButton();
    }
    // Reiniciar con Enter después de game over
    if ((gameOver || gameWon) && (e.key === 'Enter' || e.key === ' ')) {
        resetGame();
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function paddleMovement() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += paddleSensitive;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSensitive;
    }
}

/*////////////////////////// CONTROLES TÁCTILES //////////////////////////////*/

let touchStartX = null;
let isTouching = false;

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartX = touch.clientX - rect.left;
    isTouching = true;

    // Iniciar juego al tocar
    if (gamePaused && !gameOver && !gameWon && !levelTransition.active) {
        gamePaused = false;
        if (typeof updateStartButton === 'function') updateStartButton();
    }
    // Reiniciar después de game over
    if (gameOver || gameWon) {
        resetGame();
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isTouching) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = (touch.clientX - rect.left) / canvasScale;

    // Mover la pala al centro del toque
    paddleX = touchX - paddleWidth / 2;

    // Limitar dentro del canvas
    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleWidth) paddleX = canvas.width - paddleWidth;
}

function handleTouchEnd(e) {
    e.preventDefault();
    isTouching = false;
    touchStartX = null;
}

// Controles con mouse para desktop
function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / canvasScale;

    paddleX = mouseX - paddleWidth / 2;

    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleWidth) paddleX = canvas.width - paddleWidth;
}

function handleClick(e) {
    if (gamePaused && !gameOver && !gameWon && !levelTransition.active) {
        gamePaused = false;
        if (typeof updateStartButton === 'function') updateStartButton();
    }
    if (gameOver || gameWon) {
        resetGame();
    }
}

/*////////////////////////// PELOTA ////////////////////////////*/

const ballRadius = 5;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

function drawBall() {
    // Dibujar trail primero
    for (let i = 0; i < ballTrail.length; i++) {
        const t = ballTrail[i];
        const alpha = (i + 1) / ballTrail.length * 0.4;
        const radius = ballRadius * ((i + 1) / ballTrail.length) * 0.8;
        ctx.beginPath();
        ctx.arc(t.x, t.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(170, 2, 179, ${alpha})`;
        ctx.fill();
        ctx.closePath();
    }

    // Pelota principal
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#aa02b3';
    ctx.fill();
    ctx.closePath();
}

function updateBallTrail() {
    if (gamePaused || gameOver || gameWon || levelTransition.active) return;
    ballTrail.push({ x: x, y: y });
    if (ballTrail.length > TRAIL_LENGTH) {
        ballTrail.shift();
    }
}

function ballMovement() {
    if (gamePaused || gameOver || gameWon || levelTransition.active) return;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
            // Ajustar ángulo según donde golpea la pala
            const hitPos = (x - paddleX) / paddleWidth;
            const levelSpeed = LEVELS[currentLevel - 1].speed;
            dx = levelSpeed * 2 * (hitPos - 0.5);
            // Activar squash en la pala
            paddleSquash = 1.0;
        } else {
            lives--;
            updateUI();
            if (lives <= 0) {
                gameOver = true;
                if (typeof updateStartButton === 'function') updateStartButton();
            } else {
                // Reset pelota
                resetBallAndPaddle();
                gamePaused = true;
                if (typeof updateStartButton === 'function') updateStartButton();
            }
        }
    }
    x += dx;
    y += dy;
}

function resetBallAndPaddle() {
    const levelSpeed = LEVELS[currentLevel - 1].speed;
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = levelSpeed;
    dy = -levelSpeed;
    paddleX = (canvas.width - paddleWidth) / 2;
    ballTrail = [];
}

/*////////////////////////// LADRILLOS //////////////////////////////*/

const brickRowCount = 6;
const brickColumnCount = 13;
const brickWidth = 30;
const brickHeight = 14;
const brickPadding = 0;
const brickOffsetTop = 30;
const brickOffsetLeft = 29; // Centrado: (448 - 13*30) / 2 = 29
let bricks = [];

const brick_status = {
    ACTIVE: '0',
    DESTROYED: '1',
};

function initBricks() {
    const levelConfig = LEVELS[currentLevel - 1];
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            const randomColor = Math.floor(Math.random() * 8) + 1;

            let active = true;

            if (levelConfig.pattern === 'checker') {
                // Patrón checkerboard: filas y columnas alternas
                active = (c + r) % 2 === 0;
            } else if (levelConfig.pattern === 'diamond') {
                // Patrón diamante centrado
                const centerC = (brickColumnCount - 1) / 2;
                const centerR = (brickRowCount - 1) / 2;
                const distC = Math.abs(c - centerC) / centerC;
                const distR = Math.abs(r - centerR) / centerR;
                active = (distC + distR) <= 1.1;
            }
            // 'full' -> todos activos

            bricks[c][r] = {
                x: brickX,
                y: brickY,
                status: active ? brick_status.ACTIVE : brick_status.DESTROYED,
                color: randomColor
            };
        }
    }
}

initBricks();

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const currentBrick = bricks[c][r];
            if (currentBrick.status === brick_status.DESTROYED) continue;

            const clipX = (currentBrick.color - 1) * 16;

            ctx.drawImage(
                $bricks,
                clipX,
                0,
                16,
                8,
                currentBrick.x, currentBrick.y,
                brickWidth, brickHeight
            );
        }
    }
}

/*////////////////////////// COLISIONES //////////////////////////////*/

function collisionDetection() {
    if (gamePaused || gameOver || gameWon || levelTransition.active) return;

    let bricksRemaining = 0;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const currentBrick = bricks[c][r];
            if (currentBrick.status === brick_status.DESTROYED) continue;

            bricksRemaining++;

            const isBallsameXasBrick =
                x > currentBrick.x &&
                x < currentBrick.x + brickWidth;

            const isBallsameYasBrick =
                y > currentBrick.y &&
                y < currentBrick.y + brickHeight;

            if (isBallsameXasBrick && isBallsameYasBrick && currentBrick.status === brick_status.ACTIVE) {
                dy = -dy;
                currentBrick.status = brick_status.DESTROYED;
                score += 10;
                updateUI();
                // Generar partículas
                spawnParticles(currentBrick.x, currentBrick.y, brickWidth, brickHeight, currentBrick.color);
            }
        }
    }

    // Victoria si no quedan ladrillos
    if (bricksRemaining === 0) {
        if (currentLevel < LEVELS.length) {
            // Avanzar al siguiente nivel
            advanceLevel();
        } else {
            // Victoria final
            gameWon = true;
            if (typeof updateStartButton === 'function') updateStartButton();
        }
    }
}

/*////////////////////////// AVANCE DE NIVEL //////////////////////////////*/

function advanceLevel() {
    levelTransition.active = true;
    levelTransition.timer = 120; // ~2 segundos a 60fps
    levelTransition.targetLevel = currentLevel + 1;
}

function updateLevelTransition() {
    if (!levelTransition.active) return;

    levelTransition.timer--;

    if (levelTransition.timer <= 0) {
        // Iniciar el nuevo nivel
        currentLevel = levelTransition.targetLevel;
        const levelConfig = LEVELS[currentLevel - 1];
        paddleWidth = levelConfig.paddleWidth;

        initBricks();
        resetBallAndPaddle();
        particles = [];
        ballTrail = [];
        gamePaused = true;
        levelTransition.active = false;
        updateUI();
        if (typeof updateStartButton === 'function') updateStartButton();
    }
}

function drawLevelTransition() {
    if (!levelTransition.active) return;

    // Overlay oscuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Efecto zoom-in basado en el timer
    const progress = 1 - (levelTransition.timer / 120);
    const scale = 0.5 + progress * 0.5;
    const alpha = progress < 0.5 ? progress * 2 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);

    // Texto "NIVEL X"
    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`NIVEL ${levelTransition.targetLevel}`, 0, -15);

    // Subtexto
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Prepárate...', 0, 25);

    ctx.restore();
    ctx.globalAlpha = 1;
}

/*////////////////////////// UI //////////////////////////////*/

function updateUI() {
    const scoreEl = document.querySelector('#score-value');
    const livesEl = document.querySelector('#lives-value');
    const levelEl = document.querySelector('#level-value');
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
    if (levelEl) levelEl.textContent = currentLevel;
}

function drawOverlay(text, subtext) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 20);
}

function drawStartScreen() {
    drawOverlay('ARKATOMY', 'Toca o presiona cualquier tecla para jugar');
}

function drawGameOver() {
    drawOverlay('GAME OVER', `Puntuación: ${score} - Toca para reiniciar`);
}

function drawWinScreen() {
    drawOverlay('¡GANASTE!', `Puntuación final: ${score} - Toca para jugar de nuevo`);
}

/*////////////////////////// RESET //////////////////////////////*/

function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameWon = false;
    gamePaused = true;
    currentLevel = 1;
    paddleWidth = LEVELS[0].paddleWidth;
    particles = [];
    ballTrail = [];
    paddleTilt = 0;
    paddleSquash = 0;
    levelTransition = { active: false, timer: 0, targetLevel: 0 };
    resetBallAndPaddle();
    initBricks();
    updateUI();
}

/*////////////////////////// LIMPIAR CANVAS ////////////////////////*/

function cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/*////////////////////////// DIBUJAR Y ANIMAR ////////////////////////*/

function draw() {
    cleanCanvas();

    if (levelTransition.active) {
        // Durante transición, dibujar ladrillos viejos de fondo difuminado
        updateLevelTransition();
        drawLevelTransition();
        updateParticles();
        drawParticles();
    } else {
        drawBricks();
        updateBallTrail();
        drawBall();
        drawPaddle();
        drawParticles();

        if (!gameOver && !gameWon) {
            ballMovement();
            paddleMovement();
            collisionDetection();
            updateParticles();
        }

        // Mostrar overlays según estado
        if (gamePaused && !gameOver && !gameWon) {
            drawStartScreen();
        } else if (gameOver) {
            drawGameOver();
        } else if (gameWon) {
            drawWinScreen();
        }
    }

    window.requestAnimationFrame(draw);
}

/*////////////////////////// INICIACIONES ///////////////////////////*/

// Eventos de teclado
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// Eventos táctiles (móvil)
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

// Eventos de mouse (desktop)
canvas.addEventListener('mousemove', handleMouseMove, false);
canvas.addEventListener('click', handleClick, false);

/*////////////////////////// BOTONES MÓVILES ///////////////////////////*/

const btnLeft = document.querySelector('#btn-left');
const btnRight = document.querySelector('#btn-right');
const btnStart = document.querySelector('#btn-start');

function updateStartButton() {
    if (btnStart) {
        if (!gamePaused && !gameOver && !gameWon) {
            btnStart.classList.add('playing');
            btnStart.textContent = 'PAUSE';
        } else {
            btnStart.classList.remove('playing');
            btnStart.textContent = 'START';
        }
    }
}

if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        leftPressed = true;
    }, { passive: false });

    btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        leftPressed = false;
    }, { passive: false });

    btnLeft.addEventListener('mousedown', () => leftPressed = true);
    btnLeft.addEventListener('mouseup', () => leftPressed = false);
    btnLeft.addEventListener('mouseleave', () => leftPressed = false);
}

if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        rightPressed = true;
    }, { passive: false });

    btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        rightPressed = false;
    }, { passive: false });

    btnRight.addEventListener('mousedown', () => rightPressed = true);
    btnRight.addEventListener('mouseup', () => rightPressed = false);
    btnRight.addEventListener('mouseleave', () => rightPressed = false);
}

if (btnStart) {
    btnStart.addEventListener('click', () => {
        if (gameOver || gameWon) {
            resetGame();
        } else {
            gamePaused = !gamePaused;
        }
        updateStartButton();
    });

    btnStart.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// Actualizar botón cuando cambie el estado del juego
const originalResetGame = resetGame;
resetGame = function() {
    originalResetGame();
    updateStartButton();
};

// Inicializar UI
updateUI();
updateStartButton();

// Iniciar loop
draw();
