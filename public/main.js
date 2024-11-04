// Seleccionamos el canvas y el contexto 2d
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 448;
canvas.height = 400;

/*////////////////////////// PALA //////////////////////////////*/

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight;
let rightPressed = false;
let leftPressed = false;
const paddleSensitive = 10;

function drawPaddle() {
    ctx.fillStyle = 'red';
    ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
}

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
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

/*////////////////////////// PELOTA ////////////////////////////*/

const ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#39ff14';
    ctx.fill();
    ctx.closePath();
}

function ballMovement() {
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            console.log('GAME OVER');
            document.location.reload();
        }
    }
    x += dx;
    y += dy;
}

/*////////////////////////// LIMPIAR CANVAS ////////////////////////*/

function cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/*////////////////////////// DIBUJAR Y ANIMAR ////////////////////////*/

function draw() {
    cleanCanvas();
    drawBall();
    drawPaddle();
    ballMovement();
    paddleMovement();
    window.requestAnimationFrame(draw);
}

/*////////////////////////// INICIACIONES ///////////////////////////*/

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
draw();
