let slideIndex = 1;
showSlides(slideIndex);

// 次/前のコントロール
function plusSlides(n) {
  showSlides(slideIndex += n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  if (n > slides.length) {slideIndex = 1}    
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slides[slideIndex-1].style.display = "block";  
}

// ゲームの状態を管理するフラグ
let isGameOver = false;
let isGameClear = false; // ゲームクリア状態を管理するフラグ

// DOM要素の取得
const gameContainer = document.getElementById('gameFrame');
const myCircle = document.getElementById('myChara'); // 自分のキャラクター
const otherCircle = document.getElementById('otherChara'); // 相手のキャラクター
const gameFrameBlack = document.getElementById('gameFrameBlack');

const enemyChara1 = document.getElementById('enemyChara1'); // ナビゲーターが動かす敵キャラ1
const enemyChara2 = document.getElementById('enemyChara2'); // ナビゲーターが動かす敵キャラ2

const otherEnemyChara1 = document.getElementById('otherEnemyChara1'); // ビューアーが動かす敵キャラ1
const otherEnemyChara2 = document.getElementById('otherEnemyChara2'); // ビューアーが動かす敵キャラ2

const waitingScreen = document.getElementById('waitingScreen');
const SucccessConectScreen = document.getElementById('SucccessConectScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameClearScreen = document.getElementById('gameClearScreen');
const startButton = document.getElementById('startButton');
const replayButton = document.getElementById('replayButton');
const clearReplayButton = document.getElementById('clearReplayButton');
const gameStatusMessage = document.getElementById('gameStatusMessage'); // ゲーム中のメッセージ表示用

// キャラクターとゲームの変数
let myX = 0; // 自分のキャラクターのX座標
let myY = 150; // 自分のキャラクターのY座標
let otherX = 0; // 相手のキャラクターのX座標
let otherY = 150; // 相手のキャラクターのY座標
let moveSpeed = 10;

let enemy1X, enemy1Y;
let enemySpeed1 = 1; // 初期速度を元に戻す
let enemy1DirectionX = 1;
let enemy1DirectionY = 1;

let enemy2X, enemy2Y;
let enemySpeed2 = 1.5; // 初期速度を元に戻す
let enemy2DirectionX = -1;
let enemy2DirectionY = 1;

// WebSocket変数
let ws;
let myId; // 自分のID
let myRole = null; // 自分の役割 (navigator or viewer)

// キャラクターの位置を初期化する関数
function initializeCharacterPositions() {
    // 主人公キャラ（myChara）をゲーム枠の左端中央に配置
    myX = 0;
    myY = 150;
    myCircle.style.left = `${myX}px`; // left/topを使用
    myCircle.style.top = `${myY}px`; // left/topを使用
    myCircle.style.transform = 'none'; // transformをリセット

    // 相手キャラ（otherChara）も初期位置を設定
    otherX = myX; // 初期位置は同じにする
    otherY = myY;
    otherCircle.style.left = `${otherX}px`; // left/topを使用
    otherCircle.style.top = `${otherY}px`; // left/topを使用
    otherCircle.style.transform = 'none'; // transformをリセット

    // 敵キャラの初期位置を設定
    enemy1X = 100;
    enemy1Y = 100;
    enemyChara1.style.left = `${enemy1X}px`; // left/topを使用
    enemyChara1.style.top = `${enemy1Y}px`; // left/topを使用
    enemyChara1.style.transform = 'none'; // transformをリセット

    enemy2X = 300;
    enemy2Y = 300;
    enemyChara2.style.left = `${enemy2X}px`; // left/topを使用
    enemyChara2.style.top = `${enemy2Y}px`; // left/topを使用
    enemyChara2.style.transform = 'none'; // transformをリセット

    // otherEnemyCharaの初期位置も設定
    otherEnemyChara1.style.left = `${enemy1X}px`; // left/topを使用
    otherEnemyChara1.style.top = `${enemy1Y}px`; // left/topを使用
    otherEnemyChara1.style.transform = 'none'; // transformをリセット
    otherEnemyChara2.style.left = `${enemy2X}px`; // left/topを使用
    otherEnemyChara2.style.top = `${enemy2Y}px`; // left/topを使用
    otherEnemyChara2.style.transform = 'none'; // transformをリセット


    // ゲームオーバー/クリア状態をリセット
    isGameOver = false;
    isGameClear = false;
    // 背景色もリセット
    gameFrameBlack.style.backgroundColor = '#8484ff'; 
    // 速度もリセット
    moveSpeed = 10;
    enemySpeed1 = 1; // initializeCharacterPositions内で速度をリセット
    enemySpeed2 = 1.5; // initializeCharacterPositions内で速度をリセット

    // 役割に応じたキャラクターの表示/非表示と背景色の設定
    if (myRole === 'navigator') {
        myCircle.style.display = 'block'; // ナビゲーターは自分のキャラを表示
        otherCircle.style.display = 'none'; // 相手のキャラは非表示

        enemyChara1.style.display = 'block'; // ナビゲーター側の敵キャラを表示
        enemyChara2.style.display = 'block';
        otherEnemyChara1.style.display = 'none'; // ビューアー側の敵キャラは非表示
        otherEnemyChara2.style.display = 'none';

        gameFrameBlack.style.backgroundColor = '#000000ff'; 
        gameStatusMessage.textContent = 'あなたは脱出役です、キャラクターを操作して脱出を目指せ！';
    } else if (myRole === 'viewer') {
        myCircle.style.display = 'none'; // ビューアーは自分のキャラを非表示
        otherCircle.style.display = 'block'; // 相手のキャラ（ナビゲーターの動き）を表示

        enemyChara1.style.display = 'none'; // ナビゲーター側の敵キャラは非表示
        enemyChara2.style.display = 'none';
        otherEnemyChara1.style.display = 'block'; // ビューアー側の敵キャラを表示
        otherEnemyChara2.style.display = 'block';

        gameFrameBlack.style.backgroundColor = '#3bc244ff'; 
        gameStatusMessage.textContent = 'あなたはナビゲータです、脱出役にゴールまで案内しよう！';
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
    if (isGameClear) { // isGameClearのチェックを追加
        gameScreen.style.display = 'none';
        gameClearScreen.style.display = 'block';
        return; 
    }

    // ナビゲーターの場合のみ敵の動きを計算し、状態を同期する
    if (myRole === 'navigator') {
        // 敵キャラ1の移動
        enemy1X += enemySpeed1 * enemy1DirectionX;
        enemy1Y += enemySpeed1 * enemy1DirectionY; 
        
        const blackAreaOffsetX = gameContainer.offsetWidth * 0.1;
        const blackAreaWidth = gameContainer.offsetWidth * 0.8;
        const gameAreaHeight = gameContainer.offsetHeight;

        if (enemy1X + enemyChara1.offsetWidth > blackAreaOffsetX  || enemy1X < blackAreaOffsetX) {
            enemy1DirectionX *= -1;
        }
        if (enemy1Y + enemyChara1.offsetHeight > gameAreaHeight || enemy1Y < 0) {
            enemy1DirectionY *= -1;
        }
        enemyChara1.style.left = `${enemy1X}px`; // left/topを使用
        enemyChara1.style.top = `${enemy1Y}px`; // left/topを使用
        otherEnemyChara1.style.left = `${enemy1X}px`; // left/topを使用
        otherEnemyChara1.style.top = `${enemy1Y}px`; // left/topを使用

        // 敵キャラ2の移動
        enemy2X += enemySpeed2 * enemy2DirectionX;
        enemy2Y += enemySpeed2 * enemy2DirectionY;
        
        if (enemy2X + enemyChara2.offsetWidth  > blackAreaOffsetX  || enemy2X < blackAreaOffsetX) {
            enemy2DirectionX *= -1;
        }
        if (enemy2Y + enemyChara2.offsetHeight  > gameAreaHeight || enemy2Y < 0) {
            enemy2DirectionY *= -1;
        }
        enemyChara2.style.left = `${enemy2X}px`; // left/topを使用
        enemyChara2.style.top = `${enemy2Y}px`; // left/topを使用
        otherEnemyChara2.style.left = `${enemy2X}px`; // left/topを使用
        otherEnemyChara2.style.top = `${enemy2Y}px`; // left/topを使用

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
            gameFrameBlack.style.backgroundColor = '#ff0000'; // ゲームオーバー時の色
            
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

        // ゲームクリア判定 (myCharaが基準)
        const clearThresholdX = gameContainer.offsetWidth - myCircle.offsetWidth; 
        if (myX >= clearThresholdX) {
            isGameClear = true; // isGameClearを設定
            gameFrameBlack.style.backgroundColor = '#00ffff'; // ゲームクリア時の色
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
                type: 'player_move', 
                id: myId, // ナビゲーターのID
                myX: myX,
                myY: myY,
                enemy1X: enemy1X,
                enemy1Y: enemy1Y,
                enemy2X: enemy2X,
                enemy2Y: enemy2Y
            };
            ws.send(JSON.stringify(message));
        }
    } else if (myRole === 'viewer') {
        // ビューアーの場合、受信した座標を直接反映 (補間なし)
        otherCircle.style.left = `${otherX}px`;
        otherCircle.style.top = `${otherY}px`;
        otherEnemyChara1.style.left = `${enemy1X}px`;
        otherEnemyChara1.style.top = `${enemy1Y}px`;
        otherEnemyChara2.style.left = `${enemy2X}px`;
        otherEnemyChara2.style.top = `${enemy2Y}px`;
    }

    requestAnimationFrame(animate);
}

// DOMContentLoadedイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    const host = location.origin.replace(/^http/, 'ws');
    ws = new WebSocket(host + '/ws');
    myId = self.crypto.randomUUID().substr(0, 8);

    waitingScreen.style.display = 'block';

    // キーボードイベントリスナー
    document.addEventListener('keydown', (e) => {
        // 役割がナビゲーターの場合のみ操作可能
        if (isGameOver || isGameClear || myRole !== 'navigator') return; 
        
        let newX = myX;
        let newY = myY;
        switch (e.key) {
            case 'ArrowUp': newY -= moveSpeed; break;
            case 'ArrowDown': newY += moveSpeed; break;
            case 'ArrowLeft': newX -= moveSpeed; break;
            case 'ArrowRight': newX += moveSpeed; break;
            default: return;
        }
        e.preventDefault();

        const gameFrameContentWidth = gameContainer.offsetWidth; 
        const gameFrameContentHeight = gameContainer.offsetHeight;

        newX = Math.max(0, Math.min(newX, gameFrameContentWidth - myCircle.offsetWidth));
        newY = Math.max(0, Math.min(newY, gameFrameContentHeight - myCircle.offsetHeight));

        myX = newX;
        myY = newY;
        myCircle.style.left = `${myX}px`; // left/topを使用
        myCircle.style.top = `${myY}px`; // left/topを使用

        // キーダウンイベントでは自分のキャラの位置だけ更新し、
        // 敵キャラの位置を含むゲーム状態の同期はanimate()ループに任せる
    });

    window.addEventListener('resize', () => {
        if ((!isGameOver && !isGameClear) && gameScreen.style.display === 'block') { 
            initializeCharacterPositions();
        }
    });

    // WebSocketからメッセージを受信したとき
    ws.onmessage = function (msg) {
        const data = JSON.parse(msg.data);
        console.log('クライアント: メッセージを受信:', data);

        // 役割割り当てメッセージ
        if (data.type === 'role_assigned') {
            myRole = data.role;
            console.log(`クライアント: あなたの役割は ${myRole} です。`);
            // 役割に応じた初期UI表示（例：メッセージ）
            if (myRole === 'navigator') {
                gameStatusMessage.textContent = 'あなたはナビゲーターです。キャラクターを操作して脱出を目指せ！';
            } else if (myRole === 'viewer') {
                gameStatusMessage.textContent = 'あなたはビューアーです。ナビゲーターの動きをサポートしよう！';
            }
            // 役割が割り当てられたら、ゲームオーバー/クリア画面を隠し、接続完了画面を表示
            gameOverScreen.style.display = 'none';
            gameClearScreen.style.display = 'none';
            waitingScreen.style.display = 'none'; // waitingScreenも隠す
            SucccessConectScreen.style.display = 'block';
            document.getElementById('BeforePush-startBtm').style.display = 'block'; // スタートボタンのメッセージを表示
            document.getElementById('AfterPush-startBtm').style.display = 'none';
            startButton.style.display = 'block'; // スタートボタンを表示
            gameScreen.style.display = 'none'; // ゲーム画面も隠す
            
            initializeCharacterPositions(); // 新しい役割でキャラ位置を初期化
        }
        else if (data.type === 'ready') {
            waitingScreen.style.display = 'none';
            SucccessConectScreen.style.display = 'block';
        } else if (data.type === 'start_game') {
            console.log('クライアント: ゲーム開始のメッセージを受け取ったよ！');
            SucccessConectScreen.style.display = 'none';
            gameScreen.style.display = 'block';
            
            document.getElementById('BeforePush-startBtm').style.display = 'none';
            document.getElementById('AfterPush-startBtm').style.display = 'none';

            initializeCharacterPositions(); // 役割に応じた初期化も含む
            animate();
        } else if (data.type === 'GameOver') {
            console.log('クライアント: サーバーからゲームオーバーメッセージを受信！');
            isGameOver = true;
            gameScreen.style.display = 'none';
            gameOverScreen.style.display = 'block';
            gameFrameBlack.style.backgroundColor = '#000000';
        } else if (data.type === 'GameClear') {
            console.log('クライアント: サーバーからゲームクリアメッセージを受信！');
            isGameClear = true; 
            gameScreen.style.display = 'none';
            gameClearScreen.style.display = 'block';
            gameFrameBlack.style.backgroundColor = '#00ffff';
        } 
        // ゲーム状態同期メッセージを受信したときの処理 (ビューアーのみが反応)
        else if (data.type === 'player_move') { 
            // 受信したIDが自分のIDと異なる場合（つまりナビゲーターの動き）
            if (data.id !== myId) {
                // 相手のキャラクターの位置を更新
                otherX = data.myX;
                otherY = data.myY;

                // 敵キャラクターの位置を更新 (ビューアーのみ)
                enemy1X = data.enemy1X; 
                enemy1Y = data.enemy1Y;
                enemy2X = data.enemy2X;
                enemy2Y = data.enemy2Y;

                // otherEnemyChara1 と otherEnemyChara2 のスタイルを正しく更新
                otherEnemyChara1.style.left = `${enemy1X}px`;
                otherEnemyChara1.style.top = `${enemy1Y}px`;
                otherEnemyChara2.style.left = `${enemy2X}px`;
                otherEnemyChara2.style.top = `${enemy2Y}px`;
            }
        }
        // ★変更★ ゲームリセット確認メッセージを受信したときの処理 (今回はリロードしない)
        // else if (data.type === 'game_reset_ack') {
        //     console.log('クライアント: サーバーからゲームリセット確認を受信。ページをリロードします。');
        //     location.reload(); // サーバーがリセットされたことを確認してからリロード
        // }
    };

    ws.onopen = function () {
        console.log('クライアント: WebSocket接続が開きました。');
    };

    ws.onclose = function () {
        console.log('クライアント: WebSocket接続が閉じました。');
        // サーバーからの明示的なリセットACKがない限り、リロードはしない
        // if (!isGameOver && !isGameClear) { 
        //     alert('サーバーとの接続が切れました。');
        // }
    };

    ws.onerror = function (error) {
        console.error('クライアント: WebSocketエラー:', error);
        gameStatusMessage.textContent = 'WebSocketエラーが発生しました。コンソールを確認してください。';
    };

    if (startButton) {
        startButton.onclick = function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'user_ready', id: myId }));
                console.log('クライアント: スタートボタンを押したよ！');
                document.getElementById('BeforePush-startBtm').style.display = 'none';
                document.getElementById('AfterPush-startBtm').style.display = 'block';
                startButton.style.display = 'none';
            } else {
                gameStatusMessage.textContent = 'サーバーに接続されていません。ページをリロードしてください。';
            }
        };
    }

    // リプレイボタンの処理
    if (replayButton) {
        replayButton.onclick = function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                // サーバーにリセットと役割交換を要求
                ws.send(JSON.stringify({ type: 'reset_game_and_swap_roles', playerId: myId }));
                console.log('クライアント: リプレイボタンを押したよ！サーバーにリセットと役割交換要求を送信。');
                // ゲームオーバー/クリア画面を隠し、接続完了画面を表示して、サーバーからの指示を待つ
                gameOverScreen.style.display = 'none';
                gameClearScreen.style.display = 'none';
                SucccessConectScreen.style.display = 'block';
                document.getElementById('BeforePush-startBtm').style.display = 'block';
                document.getElementById('AfterPush-startBtm').style.display = 'none';
                startButton.style.display = 'block';
                gameScreen.style.display = 'none'; // ゲーム画面も隠す
            } else {
                // WebSocket接続がない場合は、直接リロード（役割交換はできないが、ゲームはリセット）
                location.reload(); 
            }
        };
    }

    // クリア後のリプレイボタンの処理
    if (clearReplayButton) {
        clearReplayButton.onclick = function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                // サーバーにリセットと役割交換を要求
                ws.send(JSON.stringify({ type: 'reset_game_and_swap_roles', playerId: myId }));
                console.log('クライアント: クリア後のリプレイボタンを押したよ！サーバーにリセットと役割交換要求を送信。');
                // ゲームオーバー/クリア画面を隠し、接続完了画面を表示して、サーバーからの指示を待つ
                gameOverScreen.style.display = 'none';
                gameClearScreen.style.display = 'none';
                SucccessConectScreen.style.display = 'block';
                document.getElementById('BeforePush-startBtm').style.display = 'block';
                document.getElementById('AfterPush-startBtm').style.display = 'none';
                startButton.style.display = 'block';
                gameScreen.style.display = 'none'; // ゲーム画面も隠す
            } else {
                // WebSocket接続がない場合は、直接リロード
                location.reload(); 
            }
        };
    }
});
