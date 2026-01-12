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

/*////////////////////////// ESTADO DEL JUEGO //////////////////////////////*/

let score = 0;
let lives = 3;
let gameOver = false;
let gameWon = false;
let gamePaused = true; // Empieza pausado para que el usuario inicie

/*////////////////////////// SPRITE//////////////////////////////*/
const $sprite = document.querySelector('#sprite');
const $bricks = document.querySelector('#bricks');

/*////////////////////////// PALA //////////////////////////////*/

const paddleHeight = 10;
const paddleWidth = 50;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight;
let rightPressed = false;
let leftPressed = false;
const paddleSensitive = 8;

function drawPaddle() {
    ctx.drawImage(
        $sprite,
        28,
        173,
        paddleWidth,
        paddleHeight,
        paddleX,
        paddleY,
        paddleWidth,
        paddleHeight
    );
}

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    }
    // Iniciar juego con cualquier tecla
    if (gamePaused && !gameOver && !gameWon) {
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
    if (gamePaused && !gameOver && !gameWon) {
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
    if (gamePaused && !gameOver && !gameWon) {
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
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#aa02b3';
    ctx.fill();
    ctx.closePath();
}

function ballMovement() {
    if (gamePaused || gameOver || gameWon) return;

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
            dx = 4 * (hitPos - 0.5);
        } else {
            lives--;
            updateUI();
            if (lives <= 0) {
                gameOver = true;
                if (typeof updateStartButton === 'function') updateStartButton();
            } else {
                // Reset pelota
                x = canvas.width / 2;
                y = canvas.height - 30;
                dx = 2;
                dy = -2;
                paddleX = (canvas.width - paddleWidth) / 2;
                gamePaused = true;
                if (typeof updateStartButton === 'function') updateStartButton();
            }
        }
    }
    x += dx;
    y += dy;
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
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            const randomColor = Math.floor(Math.random() * 8) + 1;
            bricks[c][r] = { x: brickX, y: brickY, status: brick_status.ACTIVE, color: randomColor };
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
    if (gamePaused || gameOver || gameWon) return;

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
            }
        }
    }

    // Victoria si no quedan ladrillos
    if (bricksRemaining === 0) {
        gameWon = true;
        if (typeof updateStartButton === 'function') updateStartButton();
    }
}

/*////////////////////////// UI //////////////////////////////*/

function updateUI() {
    const scoreEl = document.querySelector('#score-value');
    const livesEl = document.querySelector('#lives-value');
    if (scoreEl) scoreEl.textContent = score;
    if (livesEl) livesEl.textContent = lives;
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
    drawOverlay('¡GANASTE!', `Puntuación: ${score} - Toca para jugar de nuevo`);
}

/*////////////////////////// RESET //////////////////////////////*/

function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameWon = false;
    gamePaused = true;
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 2;
    dy = -2;
    paddleX = (canvas.width - paddleWidth) / 2;
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
    drawBricks();
    drawBall();
    drawPaddle();

    if (!gameOver && !gameWon) {
        ballMovement();
        paddleMovement();
        collisionDetection();
    }

    // Mostrar overlays según estado
    if (gamePaused && !gameOver && !gameWon) {
        drawStartScreen();
    } else if (gameOver) {
        drawGameOver();
    } else if (gameWon) {
        drawWinScreen();
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
