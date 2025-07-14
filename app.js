const express = require('express');
const expressWs = require('express-ws');

const app = express();
expressWs(app);

const port = process.env.PORT || 3001;

// 接続中の全てのクライアント（WebSocketオブジェクト）を管理する配列
let connectedClients = [];
// ゲーム開始準備が完了したプレイヤーの数をカウント
let readyPlayersCount = 0;
// ゲームが進行中かどうかを示すフラグ
let isGameActive = false; 

// 'public' フォルダ内のファイルを静的ファイルとして提供
app.use(express.static('public'));

// '/ws' パスへのWebSocket接続を待ち受ける
app.ws('/ws', (ws, req) => {
    // 新しいクライアントが接続したとき、配列に追加
    connectedClients.push(ws);
    console.log(`サーバー: 新しいクライアントが接続しました。現在の接続数: ${connectedClients.length}`);

    // 各クライアントの準備状態を管理するためのフラグ
    ws.isReady = false; 

    // 接続順に役割を割り当てる (この時点では仮の割り当て)
    if (connectedClients.length === 1) {
        ws.role = 'navigator'; // 仮の役割
        console.log('サーバー: プレイヤー1 (仮のナビゲーター) が接続しました。');
    } else if (connectedClients.length === 2) {
        ws.role = 'viewer'; // 仮の役割
        console.log('サーバー: プレイヤー2 (仮のビューアー) が接続しました。');
        
        // 2人接続したら、改めて役割を決定して通知
        assignRolesAndNotify();

        // 両方のクライアントに「準備完了」を通知
        console.log('サーバー: 2人接続しました。ゲーム開始準備完了を通知します。');
        connectedClients.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'ready', text: '接続完了' }));
            }
        });
    } else {
        // 3人目以降は接続を拒否
        ws.close(1000, 'ゲームは満員です。');
        return;
    }

    // クライアントからメッセージを受信したとき
    ws.on('message', (message) => {
        let data;
        try {
            // 受信したJSON文字列をJavaScriptオブジェクトに変換
            data = JSON.parse(message);
            console.log(`サーバー: メッセージを受信 (${data.type}):`, data);
        } catch (e) {
            console.error('サーバー: メッセージのパースに失敗しました:', e);
            return; // パースできないメッセージは無視して処理を終了
        }

        // メッセージの種類によって処理を分岐
        if (data.type === 'user_ready') {
            // このソケットがまだ準備完了とマークされていない場合のみカウントを増やす
            if (!ws.isReady) {
                ws.isReady = true; // このソケットを準備完了とマーク
                readyPlayersCount++;
                console.log(`サーバー: プレイヤーが準備完了しました。現在の準備完了数: ${readyPlayersCount}`);
            }

            // 2人以上が準備完了し、かつゲームがアクティブでない場合のみゲーム開始を全員に通知
            if (readyPlayersCount >= 2 && !isGameActive) {
                console.log('サーバー: 2人以上が準備完了。ゲーム開始を全員に通知します。');
                isGameActive = true; // ゲームをアクティブ状態にする
                connectedClients.forEach((socket) => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'start_game', message: 'ゲームが開始されました！' }));
                    }
                });
            }
        } 
        else if (data.type === 'GameOver' || data.type === 'GameClear') {
            console.log(`サーバー: ゲーム状態メッセージを受信 (${data.type}): ${data.message}`);
            // 衝突/クリアメッセージを全員に転送
            connectedClients.forEach((socket) => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify(data)); // メッセージをそのまま転送
                }
            });
            isGameActive = false; // ゲームを非アクティブ状態にする
            // readyPlayersCount と isReady は、reset_game_and_swap_roles または切断時にリセットする
        }
        // プレイヤーの移動情報を受信したときの処理
        else if (data.type === 'player_move') {
            // ナビゲーターからの移動情報のみを処理し、ゲームがアクティブな場合のみ転送
            if (ws.role === 'navigator' && isGameActive) {
                // ビューアーにのみ移動情報を転送
                connectedClients.forEach(socket => {
                    if (socket.readyState === WebSocket.OPEN && socket.role === 'viewer') {
                        // 送信者IDと位置情報をそのまま転送
                        socket.send(JSON.stringify(data));
                    }
                });
            }
        }
        // ★追加★ ゲームリセットと役割交換メッセージを受信したときの処理
        else if (data.type === 'reset_game_and_swap_roles') {
            console.log('サーバー: ゲームリセットと役割交換メッセージを受信しました。');
            resetGameAndSwapRoles();
        }
    });

    // クライアントが切断したとき
    ws.on('close', () => {
        // 切断したソケットをconnectedClients配列から削除
        connectedClients = connectedClients.filter((conn) => conn !== ws);
        if (ws.isReady) {
            readyPlayersCount--;
        }
        console.log(`サーバー: クライアントが切断しました。現在の接続数: ${connectedClients.length}, 準備完了数: ${readyPlayersCount}`);

        // もしプレイヤーが1人以下になったら、ゲーム状態をリセット
        if (connectedClients.length < 2) {
            resetGameAndNotifyClients('相手が切断しました。ゲームを再開するにはもう一度接続してください。');
        }
    });

    // エラーが発生したとき
    ws.on('error', (error) => {
        console.error('サーバー: WebSocketエラーが発生しました:', error);
    });
});

/**
 * 接続中のクライアントに役割を割り当て、通知する関数
 */
function assignRolesAndNotify() {
    if (connectedClients.length === 2) {
        // 現在の役割を把握
        const currentNavigator = connectedClients.find(client => client.role === 'navigator');
        const currentViewer = connectedClients.find(client => client.role === 'viewer');

        // 役割を交換
        if (currentNavigator && currentViewer) {
            currentNavigator.role = 'viewer';
            currentViewer.role = 'navigator';
            console.log('サーバー: 役割を交換しました。');
        } else {
            // 初回接続時など、役割がまだ割り当てられていない場合
            connectedClients[0].role = 'navigator';
            connectedClients[1].role = 'viewer';
            console.log('サーバー: 初回役割割り当てを行いました。');
        }

        // 新しい役割を各クライアントに通知
        connectedClients.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'role_assigned', role: socket.role, message: `あなたの新しい役割は ${socket.role} です。` }));
            }
        });
    }
}

/**
 * ゲーム状態をリセットし、役割を交換してクライアントに通知する関数
 */
function resetGameAndSwapRoles() {
    readyPlayersCount = 0;
    isGameActive = false; // ゲームを非アクティブ状態にする

    // 全クライアントの準備状態をリセット
    connectedClients.forEach(socket => {
        socket.isReady = false;
    });

    // 役割を交換して通知
    assignRolesAndNotify();

    // 全クライアントに「準備完了」メッセージを再送
    connectedClients.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ready', text: 'ゲームがリセットされました。新しい役割で開始してください！' }));
        }
    });
    console.log('サーバー: ゲーム状態をリセットし、役割を交換しました。');
}

/**
 * ゲーム状態をリセットし、クライアントにステータスを通知する関数 (切断時など)
 */
function resetGameAndNotifyClients(message) {
    readyPlayersCount = 0;
    isGameActive = false;
    connectedClients.forEach(socket => {
        socket.isReady = false;
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'status', message: message }));
        }
    });
    console.log(`サーバー: ゲーム状態をリセットしました。理由: ${message}`);
}


// 指定されたポートでサーバーを起動
app.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました。`);
});
