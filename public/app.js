// public/app.js

// WebSocket接続を確立するためのグローバル変数
let ws;
let myId; // 自分のID
let myRole = null; // 自分の役割 (navigator or viewer)

// ゲームの状態を管理するフラグ
let isGameOver = false;
let isGameClear = false;

// DOM要素の取得 (DOMContentLoaded内で値を割り当てる)
// グローバルスコープでの宣言は残し、DOMContentLoadedで値を割り当てる
let gameContainer;
let myChara;
let otherChara;
let gameFrameBlack;

let enemyChara1;
let enemyChara2;
let otherEnemyChara1;
let otherEnemyChara2;

let waitingScreen;
let successConnectScreen;
let gameScreen;
let gameOverScreen;
let gameClearScreen;

let startGameButton; // ID変更
let retireGameButton; // ID変更
let finishGameButton; // ID変更
let replayGameOverButton; // ID変更
let replayGameClearButton; // ID変更
let beforePushStartBtm;
let afterPushStartBtm;
let gameStatusMessage;

// キャラクターとゲームの変数
let myX = 0;
let myY = 0; // 初期位置はinitializeCharacterPositionsで計算
let otherX = 0;
let otherY = 0;
let moveSpeed = 10;

let enemy1X, enemy1Y;
let enemySpeed1 = 1;
let enemy1DirectionX = 1;
let enemy1DirectionY = 1;

let enemy2X, enemy2Y;
let enemySpeed2 = 1.5;
let enemy2DirectionX = -1;
let enemy2DirectionY = 1;

// 画面表示を切り替える関数
function showScreen(screenToShow) {
    // 全ての画面を非表示にする
    waitingScreen.style.display = 'none';
    successConnectScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameClearScreen.style.display = 'none';

    // 指定された画面を表示する
    screenToShow.style.display = 'block';

    // カルーセルを含む画面が表示されたら、最初のスライドを強制的に表示
    if (screenToShow === waitingScreen || screenToShow === successConnectScreen) {
        // 現在表示されている画面内のカルーセル要素を取得
        const currentCarouselContainer = screenToShow.querySelector('.contains');
        if (currentCarouselContainer) {
            // すべてのスライドを非表示にする
            currentCarouselContainer.querySelectorAll('.slide').forEach(slide => {
                slide.style.opacity = '0';
            });
            // 最初のラジオボタンをチェックし、対応するスライドを表示
            const firstSlideInput = currentCarouselContainer.querySelector('.slide_select:first-of-type');
            if (firstSlideInput) {
                firstSlideInput.checked = true; // ここでラジオボタンをチェック
                const slideId = firstSlideInput.id;
                // HTMLのIDが 'waitingSlideA', 'connectSlideA' のようになっているため、
                // 最後の文字だけを抽出して変換するロジックを維持
                const slideLetter = slideId.slice(-1);
                const slideNumber = slideLetter.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
                const targetSlide = currentCarouselContainer.querySelector(`.slide:nth-of-type(${slideNumber})`);
                if (targetSlide) {
                    targetSlide.style.opacity = '1';
                }
            }
        }
    }
}

// キャラクターの位置を初期化する関数
function initializeCharacterPositions() {
    const gameFrameWidth = gameFrame.offsetWidth;
    const gameFrameHeight = gameFrame.offsetHeight;
    const charaWidth = myChara.offsetWidth;
    const charaHeight = myChara.offsetHeight;

    // myCharaをゲーム枠の左端中央に配置
    myX = 0;
    myY = (gameFrameHeight - charaHeight) / 2;
    myChara.style.left = `${myX}px`;
    myChara.style.top = `${myY}px`;
    myChara.style.transform = 'none'; // transformをリセット

    // otherCharaも初期位置を設定
    otherX = myX;
    otherY = myY;
    otherChara.style.left = `${otherX}px`;
    otherChara.style.top = `${otherY}px`;
    otherChara.style.transform = 'none'; // transformをリセット

    // 敵キャラの初期位置を設定 (ゲームフレームの黒い背景の右端に配置)
    const blackAreaOffsetX = gameFrame.offsetWidth * 0.1; // gameFrameBlackのleft
    const blackAreaWidth = gameFrame.offsetWidth * 0.8; // gameFrameBlackのwidth

    enemy1X = blackAreaOffsetX + blackAreaWidth - charaWidth; // 黒い背景の右端
    enemy1Y = 0; // 上端
    enemyChara1.style.left = `${enemy1X}px`;
    enemyChara1.style.top = `${enemy1Y}px`;
    enemyChara1.style.transform = 'none'; // transformをリセット

    enemy2X = blackAreaOffsetX + blackAreaWidth - charaWidth; // 黒い背景の右端
    enemy2Y = gameFrameHeight - charaHeight; // 下端
    enemyChara2.style.left = `${enemy2X}px`;
    enemyChara2.style.top = `${enemy2Y}px`;
    enemyChara2.style.transform = 'none'; // transformをリセット

    // otherEnemyCharaの初期位置も設定
    otherEnemyChara1.style.left = `${enemy1X}px`;
    otherEnemyChara1.style.top = `${enemy1Y}px`;
    otherEnemyChara1.style.transform = 'none'; // transformをリセット
    otherEnemyChara2.style.left = `${enemy2X}px`;
    otherEnemyChara2.style.top = `${enemy2Y}px`;
    otherEnemyChara2.style.transform = 'none'; // transformをリセット


    // ゲームオーバー/クリア状態をリセット
    isGameOver = false;
    isGameClear = false;
    // 速度もリセット
    moveSpeed = 10;
    enemySpeed1 = 1; // initializeCharacterPositions内で速度をリセット
    enemySpeed2 = 1.5; // initializeCharacterPositions内で速度をリセット
    enemy1DirectionX = 1; // 敵キャラの方向もリセット
    enemy1DirectionY = 1;
    enemy2DirectionX = -1;
    enemy2DirectionY = 1;

    // 役割に応じたキャラクターの表示/非表示と背景色の設定
    if (myRole === 'navigator') {
        myChara.style.display = 'block'; // ナビゲーターは自分のキャラを表示
        otherChara.style.display = 'none'; // 相手のキャラは非表示

        enemyChara1.style.display = 'block'; // ナビゲーター側の敵キャラを表示
        enemyChara2.style.display = 'block';
        otherEnemyChara1.style.display = 'none'; // ビューアー側の敵キャラは非表示
        otherEnemyChara2.style.display = 'none';

        gameFrameBlack.style.backgroundColor = '#000000'; // ナビゲーターは真っ黒
        gameStatusMessage.textContent = 'あなたは脱出役です、キャラクターを操作して脱出を目指せ！';
    } else if (myRole === 'viewer') {
        myChara.style.display = 'none'; // ビューアーは自分のキャラを非表示
        otherChara.style.display = 'block'; // 相手のキャラ（ナビゲーターの動き）を表示

        enemyChara1.style.display = 'none'; // ナビゲーター側の敵キャラは非表示
        enemyChara2.style.display = 'none';
        otherEnemyChara1.style.display = 'block'; // ビューアー側の敵キャラを表示
        otherEnemyChara2.style.display = 'block';

        gameFrameBlack.style.backgroundColor = '#1a1a1a'; // ビューアーは少し暗い色
        gameStatusMessage.textContent = 'あなたはナビゲータです、脱出役にゴールまで案内しよう！';
    } else {
        // 役割がまだ割り当てられていない場合（初期状態など）
        myChara.style.display = 'none';
        otherChara.style.display = 'none';
        enemyChara1.style.display = 'none';
        enemyChara2.style.display = 'none';
        otherEnemyChara1.style.display = 'none';
        otherEnemyChara2.style.display = 'none';
        gameFrameBlack.style.backgroundColor = '#000000'; // デフォルトの黒
    }
}


// アニメーションループ関数
function animate() {
    // ゲームオーバーまたはゲームクリアの場合、アニメーションを停止し、対応する画面を表示
    if (isGameOver) {
        showScreen(gameOverScreen);
        gameFrameBlack.style.backgroundColor = '#ff0000'; // ゲームオーバー時の色
        return;
    }
    if (isGameClear) { // isGameClearのチェックを追加
        showScreen(gameClearScreen); // showScreenを使用
        gameFrameBlack.style.backgroundColor = '#00ffff'; // ゲームクリア時の色
        return;
    }

    // ナビゲーターの場合のみ敵の動きを計算し、状態を同期する
    if (myRole === 'navigator') {
        const charaWidth = myChara.offsetWidth;
        const charaHeight = myChara.offsetHeight;

        // ゲームフレームの有効な移動範囲を計算 (黒い背景の範囲)
        const blackAreaOffsetX = gameFrame.offsetWidth * 0.1;
        const blackAreaWidth = gameFrame.offsetWidth * 0.8;
        const gameAreaHeight = gameFrame.offsetHeight;

        // 敵キャラ1の移動
        enemy1X += enemySpeed1 * enemy1DirectionX;
        enemy1Y += enemySpeed1 * enemy1DirectionY;

        // 敵キャラ1の境界チェック (黒い背景の範囲内)
        if (enemy1X + charaWidth > blackAreaOffsetX + blackAreaWidth || enemy1X < blackAreaOffsetX) {
            enemy1DirectionX *= -1;
            enemy1X = Math.max(blackAreaOffsetX, Math.min(enemy1X, blackAreaOffsetX + blackAreaWidth - charaWidth));
        }
        if (enemy1Y + charaHeight > gameAreaHeight || enemy1Y < 0) {
            enemy1DirectionY *= -1;
            enemy1Y = Math.max(0, Math.min(enemy1Y, gameAreaHeight - charaHeight));
        }
        enemyChara1.style.left = `${enemy1X}px`; // left/topを使用
        enemyChara1.style.top = `${enemy1Y}px`; // left/topを使用

        // 敵キャラ2の移動
        enemy2X += enemySpeed2 * enemy2DirectionX;
        enemy2Y += enemySpeed2 * enemy2DirectionY;

        // 敵キャラ2の境界チェック (黒い背景の範囲内)
        if (enemy2X + charaWidth > blackAreaOffsetX + blackAreaWidth || enemy2X < blackAreaOffsetX) {
            enemy2DirectionX *= -1;
            enemy2X = Math.max(blackAreaOffsetX, Math.min(enemy2X, blackAreaOffsetX + blackAreaWidth - charaWidth));
        }
        if (enemy2Y + charaHeight > gameAreaHeight || enemy2Y < 0) {
            enemy2DirectionY *= -1;
            enemy2Y = Math.max(0, Math.min(enemy2Y, gameAreaHeight - charaHeight));
        }
        enemyChara2.style.left = `${enemy2X}px`; // left/topを使用
        enemyChara2.style.top = `${enemy2Y}px`; // left/topを使用

        // 円の衝突判定 (myCharaと敵キャラ)
        const myRadius = myChara.offsetWidth / 2;
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

        // 衝突したら
        if (distance1Squared < totalRadiusSquared || distance2Squared < totalRadiusSquared) {
            isGameOver = true;
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
            return; // ゲームオーバーになったらアニメーションループを停止
        }

        // ゲームクリア判定 (myCharaがゲームフレームの右端に到達したらクリア)
        // ゴールテキストの表示領域を考慮し、gameFrameBlackの右端をゴールとする
        const clearThresholdX = blackAreaOffsetX + blackAreaWidth - myChara.offsetWidth;
        if (myX >= clearThresholdX) {
            isGameClear = true;
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
            return; // ゲームクリアになったらアニメーションループを停止
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
        otherChara.style.left = `${otherX}px`;
        otherChara.style.top = `${otherY}px`;
        otherEnemyChara1.style.left = `${enemy1X}px`;
        otherEnemyChara1.style.top = `${enemy1Y}px`;
        otherEnemyChara2.style.left = `${enemy2X}px`;
        otherEnemyChara2.style.top = `${enemy2Y}px`;
    }

    requestAnimationFrame(animate);
}

// DOMContentLoadedイベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    gameContainer = document.getElementById('gameFrame');
    myChara = document.getElementById('myChara');
    otherChara = document.getElementById('otherChara');
    gameFrameBlack = document.getElementById('gameFrameBlack');

    enemyChara1 = document.getElementById('enemyChara1');
    enemyChara2 = document.getElementById('enemyChara2');

    otherEnemyChara1 = document.getElementById('otherEnemyChara1');
    otherEnemyChara2 = document.getElementById('otherEnemyChara2');

    waitingScreen = document.getElementById('waitingScreen');
    successConnectScreen = document.getElementById('SucccessConectScreen');
    gameScreen = document.getElementById('gameScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    gameClearScreen = document.getElementById('gameClearScreen');

    // HTMLのID変更に合わせてボタン要素を取得
    startGameButton = document.getElementById('startGameButton');
    retireGameButton = document.getElementById('retireGameButton');
    finishGameButton = document.getElementById('finishGameButton');
    replayGameOverButton = document.getElementById('replayGameOverButton');
    replayGameClearButton = document.getElementById('replayGameClearButton');

    beforePushStartBtm = document.getElementById('BeforePush-startBtm');
    afterPushStartBtm = document.getElementById('AfterPush-startBtm');
    gameStatusMessage = document.getElementById('gameStatusMessage');

    const host = location.origin.replace(/^http/, 'ws');
    ws = new WebSocket(host + '/ws');
    myId = self.crypto.randomUUID().substr(0, 8);

    // ページロード時に通信待ち画面を表示し、カルーセルを初期化
    showScreen(waitingScreen);

    // キーボードイベントリスナー
    document.addEventListener('keydown', (e) => {
        // 役割がナビゲーターの場合のみ操作可能
        if (isGameOver || isGameClear || myRole !== 'navigator') return;

        let newX = myX;
        let newY = myY;
        const charaWidth = myChara.offsetWidth;
        const charaHeight = myChara.offsetHeight;

        // ゲームフレームの有効な移動範囲を計算 (黒い背景の範囲)
        const blackAreaOffsetX = gameFrame.offsetWidth * 0.1;
        const blackAreaWidth = gameFrame.offsetWidth * 0.8;
        const gameAreaHeight = gameFrame.offsetHeight;

        switch (e.key) {
            case 'ArrowUp': newY -= moveSpeed; break;
            case 'ArrowDown': newY += moveSpeed; break;
            case 'ArrowLeft': newX -= moveSpeed; break;
            case 'ArrowRight': newX += moveSpeed; break;
            default: return;
        }
        e.preventDefault(); // デフォルトのスクロールを防ぐ

        // 移動範囲の制限 (黒い背景の範囲内)
        newX = Math.max(blackAreaOffsetX, Math.min(newX, blackAreaOffsetX + blackAreaWidth - charaWidth));
        newY = Math.max(0, Math.min(newY, gameAreaHeight - charaHeight));

        if (newX !== myX || newY !== myY) {
            myX = newX;
            myY = newY;
            myChara.style.left = `${myX}px`; // left/topを使用
            myChara.style.top = `${myY}px`; // left/topを使用
        }
    });

    window.addEventListener('resize', () => {
        // ゲーム画面が表示されている場合にのみキャラクター位置をリセット
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
            // 役割が割り当てられたら、接続完了画面を表示し、カルーセルを初期化
            showScreen(successConnectScreen);
            beforePushStartBtm.style.display = 'block';
            afterPushStartBtm.style.display = 'none';
            startGameButton.style.display = 'block'; // 新しいIDを使用

            initializeCharacterPositions(); // 新しい役割でキャラ位置を初期化
        }
        else if (data.type === 'ready') {
            // サーバーから「準備完了」メッセージを受信したら、接続完了画面に切り替える
            showScreen(successConnectScreen);
            beforePushStartBtm.style.display = 'block';
            afterPushStartBtm.style.display = 'none';
            startGameButton.style.display = 'block'; // 新しいIDを使用
        } else if (data.type === 'start_game') {
            console.log('クライアント: ゲーム開始のメッセージを受け取ったよ！');
            showScreen(gameScreen);
            gameStatusMessage.textContent = data.message; // サーバーからのメッセージを表示
            beforePushStartBtm.style.display = 'none';
            afterPushStartBtm.style.display = 'none';

            initializeCharacterPositions(); // 役割に応じた初期化も含む
            animate(); // ゲームループを開始
        } else if (data.type === 'GameOver') {
            console.log('クライアント: サーバーからゲームオーバーメッセージを受信！');
            isGameOver = true; // フラグを設定
            // animate関数内で画面切り替えと背景色変更が行われる
        } else if (data.type === 'GameClear') {
            console.log('クライアント: サーバーからゲームクリアメッセージを受信！');
            isGameClear = true; // フラグを設定
            // animate関数内で画面切り替えと背景色変更が行われる
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
        } else if (data.type === 'status') {
            console.log("Status message:", data.message); // コンソールに表示
            showScreen(waitingScreen); // 待機画面に戻る
        }
    };

    ws.onopen = function () {
        console.log('クライアント: WebSocket接続が開きました。');
    };

    ws.onclose = function () {
        console.log('クライアント: WebSocket接続が閉じました。');
    };

    ws.onerror = function (error) {
        console.error('クライアント: WebSocketエラー:', error);
        gameStatusMessage.textContent = 'WebSocketエラーが発生しました。コンソールを確認してください。';
    };

    // イベントリスナーの設定 (新しいIDを使用)
    if (startGameButton) {
        startGameButton.onclick = function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'user_ready', id: myId }));
                console.log('クライアント: スタートボタンを押したよ！');
                beforePushStartBtm.style.display = 'none';
                afterPushStartBtm.style.display = 'block';
                startGameButton.style.display = 'none';
            } else {
                gameStatusMessage.textContent = 'サーバーに接続されていません。ページをリロードしてください。';
            }
        };
    }

    if (retireGameButton) {
        retireGameButton.addEventListener('click', () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'GameOver', message: 'ゲームリタイア！' }));
            }
        });
    }

    if (finishGameButton) {
        finishGameButton.addEventListener('click', () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'reset_game_and_swap_roles' }));
            }
        });
    }

    if (replayGameOverButton) {
        replayGameOverButton.onclick = function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'reset_game_and_swap_roles', playerId: myId }));
                console.log('クライアント: リプレイボタンを押したよ！サーバーにリセットと役割交換要求を送信。');
                showScreen(successConnectScreen); // showScreenを使用
                beforePushStartBtm.style.display = 'block';
                afterPushStartBtm.style.display = 'none';
                startGameButton.style.display = 'block'; // 新しいIDを使用
            } else {
                location.reload();
            }
        };
    }

    if (replayGameClearButton) {
        replayGameClearButton.onclick = function() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'reset_game_and_swap_roles', playerId: myId }));
                console.log('クライアント: クリア後のリプレイボタンを押したよ！サーバーにリセットと役割交換要求を送信。');
                showScreen(successConnectScreen); // showScreenを使用
                beforePushStartBtm.style.display = 'block';
                afterPushStartBtm.style.display = 'none';
                startGameButton.style.display = 'block'; // 新しいIDを使用
            } else {
                location.reload();
            }
        };
    }

    // カルーセルのラジオボタンの変更を監視してスライドを切り替える
    // 各カルーセル内のラジオボタンにイベントリスナーを設定
    document.querySelectorAll('.carousel').forEach(carousel => {
        carousel.querySelectorAll('.slide_select').forEach(input => {
            input.addEventListener('change', (event) => {
                const parentCarouselContainer = event.target.closest('.contains');
                if (parentCarouselContainer) {
                    parentCarouselContainer.querySelectorAll('.slide').forEach(slide => {
                        slide.style.opacity = '0';
                    });
                    const selectedSlideId = event.target.id;
                    const selectedSlideNumber = selectedSlideId.slice(-1).charCodeAt(0) - 'A'.charCodeAt(0) + 1;
                    const selectedSlide = parentCarouselContainer.querySelector(`.slide:nth-of-type(${selectedSlideNumber})`);
                    if (selectedSlide) {
                        selectedSlide.style.opacity = '1';
                    }
                }
            });
        });
    });
});
