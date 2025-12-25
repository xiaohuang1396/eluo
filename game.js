// 游戏配置
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#F538FF',  // 紫色
    '#FF8E0D',  // 橙色
    '#FFE138',  // 黄色
    '#3877FF'   // 青色
];

// 猪猪侠图案数据URL
const PIGGY_IMAGE_DATA = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxMCIgZmlsbD0iI2Y4MGIwMCIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTIiIHI9IjIiIGZpbGw9IiMwMDAiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjEyIiByPSIyIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMTIiIHk9IjE4IiB3aWR0aD0iNiIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwIi8+PHBhdGggZD0iTTkgMjFoMTJjMS4xIDAgMi0wLjkgMi0ycy0wLjktMi0yLTJINTljLTEuMSAwLTIgMC45LTIgMnMwLjkgMiAyIDJ6Ii8+PHBhdGggZD0iTTkgMjRoMTJjMC41NSAwIDEtMC40NSAxLTFzLTAuNDUtMS0xLTFoLTEyYy0wLjU1IDAtMSAwLjQ1LTEgMXMwLjQ1IDEgMSAxeiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==';

// 图片对象
let piggyImage = new Image();
piggyImage.src = PIGGY_IMAGE_DATA;

// 方块形状定义
const SHAPES = [
    [],
    [[1, 1, 1]],  // I形
    [[1, 1], [1, 1]],  // O形
    [[0, 1, 0], [1, 1, 1]],  // T形
    [[1, 0, 0], [1, 1]],  // L形
    [[0, 0, 1], [1, 1, 1]],  // J形
    [[1, 1, 0], [0, 1, 1]],  // S形
    [[0, 1, 1], [1, 1, 0]]   // Z形
];

// 游戏状态
let canvas, ctx, nextCanvas, nextCtx;
let board = [];
let currentPiece;
let nextPiece;
let score = 0;
let gameOver = false;
let dropInterval = 1000;
let lastDropTime = 0;

// 音频元素
let bgm, moveSound, clearSound;

// 方块类
class Piece {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type];
        this.color = COLORS[type];
        this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
    }

    // 旋转方块
    rotate() {
        const rotated = [];
        const rows = this.shape.length;
        const cols = this.shape[0].length;
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = this.shape[rows - 1 - j][i];
            }
        }
        
        const temp = this.shape;
        this.shape = rotated;
        
        // 检查旋转后是否碰撞，如果碰撞则恢复原状
        if (this.collision()) {
            this.shape = temp;
        } else {
            // 播放移动音效
            moveSound.volume = 0.5;
            moveSound.currentTime = 0;
            moveSound.play().catch(e => console.log('旋转音效播放失败:', e));
        }
    }

    // 检查碰撞
    collision() {
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[y].length; x++) {
                if (this.shape[y][x]) {
                    const newX = this.x + x;
                    const newY = this.y + y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 移动方块
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
        
        if (this.collision()) {
            this.x -= dx;
            this.y -= dy;
            return false;
        }
        
        // 播放移动音效
        moveSound.volume = 0.5;
        moveSound.currentTime = 0;
        moveSound.play().catch(e => console.log('移动音效播放失败:', e));
        
        return true;
    }

    // 将方块固定到游戏板上
    lock() {
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[y].length; x++) {
                if (this.shape[y][x]) {
                    board[this.y + y][this.x + x] = this.type;
                }
            }
        }
    }
}

// 初始化游戏
function init() {
    // 获取Canvas元素
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('nextCanvas');
    nextCtx = nextCanvas.getContext('2d');
    
    // 获取音频元素
    bgm = document.getElementById('bgm');
    moveSound = document.getElementById('moveSound');
    clearSound = document.getElementById('clearSound');
    
    // 初始化游戏板
    for (let y = 0; y < ROWS; y++) {
        board[y] = [];
        for (let x = 0; x < COLS; x++) {
            board[y][x] = 0;
        }
    }
    
    // 创建初始方块
    currentPiece = new Piece(Math.floor(Math.random() * 7) + 1);
    nextPiece = new Piece(Math.floor(Math.random() * 7) + 1);
    
    // 重置分数和游戏结束状态
    score = 0;
    gameOver = false;
    document.getElementById('score').textContent = score;
    
    // 播放背景音乐
    bgm.volume = 0.3;
    bgm.play().catch(e => console.log('背景音乐播放失败:', e));
    
    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 绘制游戏板
function drawBoard() {
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            drawBlock(x, y, board[y][x]);
        }
    }
}

// 绘制单个方块
function drawBlock(x, y, color) {
    if (color) {
        // 绘制背景颜色
        ctx.fillStyle = COLORS[color];
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        
        // 绘制猪猪侠图片
        if (piggyImage.complete) {
            ctx.drawImage(piggyImage, x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 5, BLOCK_SIZE - 5);
        }
        
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    }
}

// 绘制当前方块
function drawCurrentPiece() {
    if (currentPiece) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    drawBlock(currentPiece.x + x, currentPiece.y + y, currentPiece.type);
                }
            }
        }
    }
}

// 绘制下一个方块
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * 20) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * 20) / 2;
        
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    // 绘制背景颜色
                    nextCtx.fillStyle = COLORS[nextPiece.type];
                    nextCtx.fillRect(offsetX + x * 20, offsetY + y * 20, 19, 19);
                    
                    // 绘制猪猪侠图片
                    if (piggyImage.complete) {
                        nextCtx.drawImage(piggyImage, offsetX + x * 20 + 2, offsetY + y * 20 + 2, 15, 15);
                    }
                    
                    nextCtx.strokeStyle = '#000';
                    nextCtx.strokeRect(offsetX + x * 20, offsetY + y * 20, 19, 19);
                }
            }
        }
    }
}

// 检测并消除满行
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        let isFull = true;
        for (let x = 0; x < COLS; x++) {
            if (!board[y][x]) {
                isFull = false;
                break;
            }
        }
        
        if (isFull) {
            // 移除满行
            for (let row = y; row > 0; row--) {
                for (let x = 0; x < COLS; x++) {
                    board[row][x] = board[row - 1][x];
                }
            }
            // 顶部行清空
            for (let x = 0; x < COLS; x++) {
                board[0][x] = 0;
            }
            // 重新检查当前行
            y++;
            linesCleared++;
        }
    }
    
    // 更新分数
    if (linesCleared > 0) {
        score += linesCleared * linesCleared * 100;
        document.getElementById('score').textContent = score;
        
        // 播放消除音效
        clearSound.volume = 0.7;
        clearSound.currentTime = 0;
        clearSound.play().catch(e => console.log('消除音效播放失败:', e));
    }
}

// 生成新方块
function spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = new Piece(Math.floor(Math.random() * 7) + 1);
    
    // 检查游戏是否结束
    if (currentPiece.collision()) {
        gameOver = true;
        alert(`游戏结束！最终分数: ${score}`);
    }
}

// 游戏主循环
function gameLoop(currentTime) {
    if (currentTime - lastDropTime > dropInterval) {
        if (!gameOver) {
            if (!currentPiece.move(0, 1)) {
                currentPiece.lock();
                clearLines();
                spawnNewPiece();
            }
        }
        lastDropTime = currentTime;
    }
    
    // 绘制游戏
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    drawCurrentPiece();
    drawNextPiece();
    
    requestAnimationFrame(gameLoop);
}

// 键盘控制
function handleKeyPress(event) {
    if (gameOver) return;
    
    switch (event.keyCode) {
        case 37:  // 左箭头
            currentPiece.move(-1, 0);
            break;
        case 38:  // 上箭头 - 旋转
            currentPiece.rotate();
            break;
        case 39:  // 右箭头
            currentPiece.move(1, 0);
            break;
        case 40:  // 下箭头 - 加速下落
            if (!currentPiece.move(0, 1)) {
                currentPiece.lock();
                clearLines();
                spawnNewPiece();
            }
            break;
        case 32:  // 空格 - 直接下落
            while (currentPiece.move(0, 1));
            currentPiece.lock();
            clearLines();
            spawnNewPiece();
            break;
    }
}

// 初始化游戏
window.addEventListener('load', () => {
    init();
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('restartBtn').addEventListener('click', init);
});
