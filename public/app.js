// ゲームの状態を管理するフラグ
let isGameOver = false;
let isGameClear = false; // ゲームクリア状態を管理するフラグ

// DOM要素の取得
const gameContainer = document.getElementById('gameFrame');
const myCircle = document.getElementById('myChara'); // 自分のキャラクター
const otherCircle = document.getElementById('otherChara'); // 相手のキャラクター
const gameFrameBlack = document.getElementById('gameFrameBlack');

const enemyChara1 = document.getElementById('enemyChara1');
const enemyChara2 = document.getElementById('enemyChara2');
const enemyChara1 = document.getElementById('enemyChara1'); // ナビゲーターが動かす敵キャラ1
const enemyChara2 = document.getElementById('enemyChara2'); // ナビゲーターが動かす敵キャラ2

const otherenemyChara1 = document.getElementById('otherenemyChara1');
const otherenemyChara2 = document.getElementById('otherenemyChara2');
const otherEnemyChara1 = document.getElementById('otherEnemyChara1'); // ビューアーが動かす敵キャラ1
const otherEnemyChara2 = document.getElementById('otherEnemyChara2'); // ビューアーが動かす敵キャラ2

const waitingScreen = document.getElementById('waitingScreen');
const SucccessConectScreen = document.getElementById('SucccessConectScreen');
@@ -48,8 +49,8 @@ let myRole = null; // 自分の役割 (navigator or viewer)
// キャラクターの位置を初期化する関数
function initializeCharacterPositions() {
// 主人公キャラ（myChara）をゲーム枠の中央に配置
    myX = 0;
    myY = 150;
    myX = gameContainer.offsetWidth / 2 - myCircle.offsetWidth / 2;
    myY = gameContainer.offsetHeight / 2 - myCircle.offsetHeight / 2;
myCircle.style.left = `${myX}px`;
myCircle.style.top = `${myY}px`;
myCircle.style.transform = 'none';
@@ -71,13 +72,16 @@ function initializeCharacterPositions() {
enemyChara2.style.left = `${enemy2X}px`;
enemyChara2.style.top = `${enemy2Y}px`;

    otherenemyChara1.style.left = `${enemy1X}px`;
    otherenemyChara1.style.top = `${enemy1Y}px`;
    otherenemyChara2.style.left = `${enemy2X}px`;
    otherenemyChara2.style.top = `${enemy2Y}px`;
    // otherEnemyCharaの初期位置も設定
    otherEnemyChara1.style.left = `${enemy1X}px`;
    otherEnemyChara1.style.top = `${enemy1Y}px`;
    otherEnemyChara2.style.left = `${enemy2X}px`;
    otherEnemyChara2.style.top = `${enemy2Y}px`;

    // ゲームオーバー状態をリセット

    // ゲームオーバー/クリア状態をリセット
isGameOver = false;
    isGameClear = false;
// 背景色もリセット
gameFrameBlack.style.backgroundColor = '#8484ff'; 
// 速度もリセット
@@ -89,123 +93,148 @@ function initializeCharacterPositions() {
if (myRole === 'navigator') {
myCircle.style.display = 'block'; // ナビゲーターは自分のキャラを表示
otherCircle.style.display = 'none'; // 相手のキャラは非表示
        otherenemyChara1.style.display = 'none'; // 相手の敵キャラ1を非表示
        otherenemyChara2.style.display = 'none'; // 相手の敵キャラ2を非表示
        enemyChara1.style.display = 'block'; // 自分の敵キャラ1を表示
        enemyChara2.style.display = 'block'; // 自分の敵キャラ2を表示

        enemyChara1.style.display = 'block'; // ナビゲーター側の敵キャラを表示
        enemyChara2.style.display = 'block';
        otherEnemyChara1.style.display = 'none'; // ビューアー側の敵キャラは非表示
        otherEnemyChara2.style.display = 'none';

gameFrameBlack.classList.remove('dark-mode'); // 通常の背景色
gameStatusMessage.textContent = 'あなたはナビゲーターです。キャラクターを操作して脱出を目指せ！';
} else if (myRole === 'viewer') {
myCircle.style.display = 'none'; // ビューアーは自分のキャラを非表示
otherCircle.style.display = 'block'; // 相手のキャラ（ナビゲーターの動き）を表示
        otherenemyChara1.style.display = 'block'; // 相手の敵キャラ1を表示
        
        otherenemyChara2.style.display = 'block'; // 相手の敵キャラ2を表示
        enemyChara1.style.display = 'none'; // 自分の敵キャラ1を非表示
        enemyChara2.style.display = 'none'; // 自分の敵キャラ2を非表示
        

        enemyChara1.style.display = 'none'; // ナビゲーター側の敵キャラは非表示
        enemyChara2.style.display = 'none';
        otherEnemyChara1.style.display = 'block'; // ビューアー側の敵キャラを表示
        otherEnemyChara2.style.display = 'block';

gameFrameBlack.classList.add('dark-mode'); // 暗い背景色
gameStatusMessage.textContent = 'あなたはビューアーです。ナビゲーターの動きをサポートしよう！';
}
    
}


// アニメーションループ関数
function animate() {
    // ゲームオーバーまたはゲームクリアの場合、アニメーションを停止し、対応する画面を表示
if (isGameOver) {
gameScreen.style.display = 'none';
gameOverScreen.style.display = 'block';
return; 
}
}
    if (isGameClear) { // isGameClearのチェックを追加
        gameScreen.style.display = 'none';
        gameClearScreen.style.display = 'block';
        return; 
    }

    // 敵キャラ1の移動
    enemy1X += enemySpeed1 * enemy1DirectionX;
    enemy1Y += enemySpeed1 * enemy1DirectionY;
    
    const blackAreaOffsetX = gameContainer.offsetWidth * 0.1;
    const blackAreaWidth = gameContainer.offsetWidth * 0.8;
    const gameAreaHeight = gameContainer.offsetHeight;
    // ナビゲーターの場合のみ敵の動きを計算し、状態を同期する
    if (myRole === 'navigator') {
        // 敵キャラ1の移動
        enemy1X += enemySpeed1 * enemy1DirectionX;
        enemy1Y += enemySpeed1 * enemy1DirectionY; // ここを修正
        
        const blackAreaOffsetX = gameContainer.offsetWidth * 0.1;
        const blackAreaWidth = gameContainer.offsetWidth * 0.8;
        const gameAreaHeight = gameContainer.offsetHeight;

    if (enemy1X + enemyChara1.offsetWidth > blackAreaOffsetX + blackAreaWidth || enemy1X < blackAreaOffsetX) {
        enemy1DirectionX *= -1;
    }
    if (enemy1Y + enemyChara1.offsetHeight > gameAreaHeight || enemy1Y < 0) {
        enemy1DirectionY *= -1;
    }
    enemyChara1.style.left = `${enemy1X}px`;
    enemyChara1.style.top = `${enemy1Y}px`;
        if (enemy1X + enemyChara1.offsetWidth > blackAreaOffsetX + blackAreaWidth || enemy1X < blackAreaOffsetX) {
            enemy1DirectionX *= -1;
        }
        if (enemy1Y + enemyChara1.offsetHeight > gameAreaHeight || enemy1Y < 0) {
            enemy1DirectionY *= -1;
        }
        enemyChara1.style.left = `${enemy1X}px`;
        enemyChara1.style.top = `${enemy1Y}px`;

    // 敵キャラ2の移動
    enemy2X += enemySpeed2 * enemy2DirectionX;
    enemy2Y += enemySpeed2 * enemy2DirectionY;
    
    if (enemy2X + enemyChara2.offsetWidth > blackAreaOffsetX + blackAreaWidth || enemy2X < blackAreaOffsetX) {
        enemy2DirectionX *= -1;
    }
    if (enemy2Y + enemyChara2.offsetHeight > gameAreaHeight || enemy2Y < 0) {
        enemy2DirectionY *= -1;
    }
    enemyChara2.style.left = `${enemy2X}px`;
    enemyChara2.style.top = `${enemy2Y}px`;
        // 敵キャラ2の移動
        enemy2X += enemySpeed2 * enemy2DirectionX;
        enemy2Y += enemySpeed2 * enemy2DirectionY;
        
        if (enemy2X + enemyChara2.offsetWidth > blackAreaOffsetX + blackAreaWidth || enemy2X < blackAreaOffsetX) {
            enemy2DirectionX *= -1;
        }
        if (enemy2Y + enemyChara2.offsetHeight > gameAreaHeight || enemy2Y < 0) {
            enemy2DirectionY *= -1;
        }
        enemyChara2.style.left = `${enemy2X}px`;
        enemyChara2.style.top = `${enemy2Y}px`;

    // 円の衝突判定 (myCharaと敵キャラ)
    const myRadius = myCircle.offsetWidth / 2;
    const enemyRadius = enemyChara1.offsetWidth / 2;
    const totalRadiusSquared = Math.pow(myRadius + enemyRadius, 2);
    
    const myCenterX = myX + myRadius;
    const myCenterY = myY + myRadius;
    
    const enemy1CenterX = enemy1X + enemyRadius;
    const enemy1CenterY = enemy1Y + enemyRadius;
    
    const enemy2CenterX = enemy2X + enemyRadius;
    const enemy2CenterY = enemy2Y + enemyRadius;
    
    const distance1Squared = Math.pow(myCenterX - enemy1CenterX, 2) + Math.pow(myCenterY - enemy1CenterY, 2);
    const distance2Squared = Math.pow(myCenterX - enemy2CenterX, 2) + Math.pow(myCenterY - enemy2CenterY, 2);

    if (distance1Squared < totalRadiusSquared || distance2Squared < totalRadiusSquared) {
        isGameOver = true;
        gameFrameBlack.style.backgroundColor = '#000000';
        // 円の衝突判定 (myCharaと敵キャラ)
        const myRadius = myCircle.offsetWidth / 2;
        const enemyRadius = enemyChara1.offsetWidth / 2;
        const totalRadiusSquared = Math.pow(myRadius + enemyRadius, 2);

        if (ws && ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'GameOver',
                message: 'プレイヤーが敵と衝突しました！',
                playerId: myId,
                role: myRole
            };
            console.log('ゲームオーバーメッセージをサーバーに送ったよ！');
            ws.send(JSON.stringify(message));
        const myCenterX = myX + myRadius;
        const myCenterY = myY + myRadius;
        
        const enemy1CenterX = enemy1X + enemyRadius;
        const enemy1CenterY = enemy1Y + enemyRadius;
        
        const enemy2CenterX = enemy2X + enemyRadius;
        const enemy2CenterY = enemy2Y + enemyRadius;
        
        const distance1Squared = Math.pow(myCenterX - enemy1CenterX, 2) + Math.pow(myCenterY - enemy1CenterY, 2);
        const distance2Squared = Math.pow(myCenterX - enemy2CenterX, 2) + Math.pow(myCenterY - enemy2CenterY, 2);

        if (distance1Squared < totalRadiusSquared || distance2Squared < totalRadiusSquared) {
            isGameOver = true;
            gameFrameBlack.style.backgroundColor = '#000000';
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 'GameOver',
                    message: 'プレイヤーが敵と衝突しました！',
                    playerId: myId,
                    role: myRole
                };
                console.log('ゲームオーバーメッセージをサーバーに送ったよ！');
                ws.send(JSON.stringify(message));
            }
}
    }

    // ゲームクリア判定 (myCharaが基準)
    const clearThresholdX = gameContainer.offsetWidth - myCircle.offsetWidth; 
    if (myX >= clearThresholdX) {
        isGameOver = true;
        gameFrameBlack.style.backgroundColor = '#00ffff';
        gameScreen.style.display = 'none';
        gameClearScreen.style.display = 'block';
        // ゲームクリア判定 (myCharaが基準)
        const clearThresholdX = gameContainer.offsetWidth - myCircle.offsetWidth; 
        if (myX >= clearThresholdX) {
            isGameClear = true; // isGameClearを設定
            gameFrameBlack.style.backgroundColor = '#00ffff';
            gameScreen.style.display = 'none';
            gameClearScreen.style.display = 'block';

            if (ws && ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 'GameClear',
                    message: 'プレイヤーがゲームクリアしました！',
                    playerId: myId,
                    role: myRole
                };
                console.log('ゲームクリアメッセージをサーバーに送ったよ！');
                ws.send(JSON.stringify(message));
            }
        }

        // 自分のキャラクターと敵キャラクターの全状態をサーバーに送信 (ナビゲーターのみ)
if (ws && ws.readyState === WebSocket.OPEN) {
const message = {
                type: 'GameClear',
                message: 'プレイヤーがゲームクリアしました！',
                playerId: myId,
                role: myRole
                type: 'player_move', // ★変更★ game_state_sync から player_move に変更
                id: myId, // ナビゲーターのID
                myX: myX,
                myY: myY,
                enemy1X: enemy1X,
                enemy1Y: enemy1Y,
                enemy2X: enemy2X,
                enemy2Y: enemy2Y
};
            console.log('ゲームクリアメッセージをサーバーに送ったよ！');
ws.send(JSON.stringify(message));
}
}
    // ビューアーの場合、敵の動きは計算しない。受信した情報で更新される。
    // 衝突判定やゲームクリア判定もナビゲーター側で処理され、結果がサーバー経由で来る。

requestAnimationFrame(animate);

}

// DOMContentLoadedイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
@@ -218,7 +247,7 @@ document.addEventListener('DOMContentLoaded', () => {
// キーボードイベントリスナー
document.addEventListener('keydown', (e) => {
// 役割がナビゲーターの場合のみ操作可能
        if (isGameOver || myRole !== 'navigator') return; 
        if (isGameOver || isGameClear || myRole !== 'navigator') return; 

let newX = myX;
let newY = myY;
@@ -242,24 +271,12 @@ document.addEventListener('DOMContentLoaded', () => {
myCircle.style.left = `${myX}px`;
myCircle.style.top = `${myY}px`;

        // 自分の位置情報をサーバーに送信
        if (ws && ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'player_move',
                id: myId,
                myX: myX,
                myY: myY,
                enemy1X: enemy1X,
                enemy1Y: enemy1Y,
                enemy2X: enemy2X,
                enemy2Y: enemy2Y
            };
            ws.send(JSON.stringify(message));
        }
        // キーダウンイベントでは自分のキャラの位置だけ更新し、
        // 敵キャラの位置を含むゲーム状態の同期はanimate()ループに任せる
});

window.addEventListener('resize', () => {
        if (!isGameOver && gameScreen.style.display === 'block') {
        if ((!isGameOver && !isGameClear) && gameScreen.style.display === 'block') { // isGameClearもチェック
initializeCharacterPositions();
}
});
@@ -301,34 +318,32 @@ document.addEventListener('DOMContentLoaded', () => {
gameFrameBlack.style.backgroundColor = '#000000';
} else if (data.type === 'GameClear') {
console.log('クライアント: サーバーからゲームクリアメッセージを受信！');
            isGameOver = true;
            isGameClear = true; // isGameClearを設定
gameScreen.style.display = 'none';
gameClearScreen.style.display = 'block';
gameFrameBlack.style.backgroundColor = '#00ffff';
} 
        // 相手の位置情報を受信したときの処理
        else if (data.type === 'player_move') {
            // 受信したIDが自分のIDと異なる場合（つまり相手の動き）
        // ★変更点★ ゲーム状態同期メッセージを受信したときの処理 (ビューアーのみが反応)
        else if (data.type === 'player_move') { // ★変更★ game_state_sync から player_move に変更
            // 受信したIDが自分のIDと異なる場合（つまりナビゲーターの動き）
if (data.id !== myId) {
                otherX = data.x;
                otherY = data.y;
                otherCircle.style.left = `${otherX}px`;
                otherCircle.style.top = `${otherY}px`;
                // 相手のキャラクターの位置を更新
otherX = data.myX;
otherY = data.myY;
otherCircle.style.left = `${otherX}px`;
otherCircle.style.top = `${otherY}px`;

// 敵キャラクターの位置を更新 (ビューアーのみ)
                enemy1X = data.enemy1X;
                enemy1X = data.enemy1X; // ビューアーのローカル変数を更新
enemy1Y = data.enemy1Y;
                otherenemyChara1.style.left = `${enemy1X}px`;
                otherenemyChara1style.top = `${enemy1Y}px`;

enemy2X = data.enemy2X;
enemy2Y = data.enemy2Y;
                otherenemyChara2.style.left = `${enemy2X}px`;
                otherenemyChara2.style.top = `${enemy2Y}px`;

                // ★修正★ otherEnemyChara1 と otherEnemyChara2 のスタイルを正しく更新
                otherEnemyChara1.style.left = `${enemy1X}px`;
                otherEnemyChara1.style.top = `${enemy1Y}px`;
                otherEnemyChara2.style.left = `${enemy2X}px`;
                otherEnemyChara2.style.top = `${enemy2Y}px`;
}
}
};
@@ -339,7 +354,7 @@ document.addEventListener('DOMContentLoaded', () => {

ws.onclose = function () {
console.log('クライアント: WebSocket接続が閉じました。');
        if (!isGameOver) {
        if (!isGameOver && !isGameClear) { // isGameClearもチェック
alert('サーバーとの接続が切れました。');
}
};