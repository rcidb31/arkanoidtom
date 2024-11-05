
/*////////////////////////// CANVAS //////////////////////////////*/

// Seleccionamos el canvas y el contexto 2d
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 448;
canvas.height = 400;

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
const paddleSensitive = 10;

function drawPaddle() {
   
    // ctx.drawImage(
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

/*////////////////////////// LADRILLOS //////////////////////////////*/

const brickRowCount = 6;
const brickColumnCount = 13;
const brickWidth = 30;
const brickHeight = 14;
const brickPadding = 2;
const brickOffsetTop = 30;
const brickOffsetLeft = 16;
const bricks = [];  

const brick_status = 
{
    ACTIVE: '0',
    DESTROYED: '1',
};

// creamos un array de 13 columnas y 6 filas

for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {

        // calculamos la posicion de cada ladrillo
     const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
     const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;

     // constante math floor para redondear y math random para generar un numero aleatorio entre 1 y 8 
     const randomColor = Math.floor(Math.random()*8)+1;
    // Nos creamos un objeto con las propiedades de cada ladrillo
     bricks[c][r] = { x: brickX, y: brickY, status: brick_status.ACTIVE , color: randomColor};
    }
}

function drawBricks() { 
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const currentBrick = bricks[c][r];
            if (currentBrick.status === brick_status.DESTROYED) continue;

            // Calcular clipX en función del color actual
            const clipX = (currentBrick.color - 1) * 17; // Asumiendo 25 píxeles de ancho por color en el sprite

            ctx.drawImage(
                $bricks,
                clipX,       // posición x en el sprite
                11,          // posición y en el sprite (ajústalo si es necesario)
                17,          // ancho de cada color en el sprite
                8,          // alto de cada color en el sprite
                currentBrick.x, currentBrick.y,
                brickWidth, brickHeight
            );
        }
    }
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
    drawBricks();
    window.requestAnimationFrame(draw);
}

/*////////////////////////// INICIACIONES ///////////////////////////*/

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
draw();
