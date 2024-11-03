/*//////////////////ESTRUCTURA CANVAS ///////////////////////////*/

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 448;
canvas.height = 400;

/*//////////////////////////PALA////////////////////////////*/

const paddleHeight = 10;
const paddleWidth = 75;

let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight;

let rightPressed = false;
let leftPressed = false;

const paddle_sensitive = 10;

function drawPaddle() {
    ctx.fillStyle = 'red';
    ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
}

function initEvent() {
    document.addEventListener('keydown', keyDownHandler, false);
    document.addEventListener('keyup', keyUpHandler, false);
}

function keyDownHandler(e) {
    if (e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'ArrowLeft') {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

function paddleMovement() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += paddle_sensitive;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddle_sensitive;
    }
}

/*/////////////////////////PELOTA///////////////////////////*/

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

/*////////////////////////// limpiar canvas ////////////////////////*/

function cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/*////////////////////////// ladrillos ///////////////////////////*/

function drawBricks() {
    // Implementación de ladrillos aquí
}

function collisionDetection() {
    // Implementación de detección de colisiones aquí
}

/*//////////////////////////llamado a funciones ///////////////////////////*/

function draw() {
    cleanCanvas();
    drawBall();
    drawPaddle();
    drawBricks();
    collisionDetection();
    ballMovement();
    paddleMovement();
    window.requestAnimationFrame(draw);
}

/*////////////////////////// Iniciaciones ///////////////////////////*/

draw();
initEvent();
