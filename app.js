const express = require('express');
const expressWs = require('express-ws');

const app = express();
expressWs(app);

const port = process.env.PORT || 3001;

// 接続中の全てのクライアント（WebSocketオブジェクト）を管理する配列
let connectedClients = [];
// ゲーム開始準備が完了したプレイヤーの数をカウント
let readyPlayersCount = 0;

// 'public' フォルダ内のファイルを静的ファイルとして提供
app.use(express.static('public'));

// '/ws' パスへのWebSocket接続を待ち受ける
app.ws('/ws', (ws, req) => {
  // 新しいクライアントが接続したとき、配列に追加
  connectedClients.push(ws);
  console.log(`サーバー: 新しいクライアントが接続しました。現在の接続数: ${connectedClients.length}`);

  // 各クライアントの準備状態を管理するためのフラグ
  ws.isReady = false; 

  // 接続順に役割を割り当てる
  if (connectedClients.length === 1) {
    ws.role = 'navigator'; // 最初の接続は操作者
    console.log('サーバー: プレイヤー1 (ナビゲーター) が接続しました。');
    ws.send(JSON.stringify({ type: 'role_assigned', role: 'navigator', message: 'あなたはナビゲーターです。' }));
  } else if (connectedClients.length === 2) {
    ws.role = 'viewer'; // 2番目の接続は見る人
    console.log('サーバー: プレイヤー2 (ビューアー) が接続しました。');
    ws.send(JSON.stringify({ type: 'role_assigned', role: 'viewer', message: 'あなたはビューアーです。' }));
    
    // 2人接続したら、両方のクライアントに「準備完了」を通知
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

      // 2人以上が準備完了したらゲーム開始を全員に通知
      if (readyPlayersCount >= 2) {
        console.log('サーバー: 2人以上が準備完了。ゲーム開始を全員に通知します。');
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
      readyPlayersCount = 0;
      connectedClients.forEach(socket => {
        socket.isReady = false;
      });
    }
    // プレイヤーの移動情報を受信したときの処理
    else if (data.type === 'player_move') {
        // ナビゲーターからの移動情報のみを処理
        if (ws.role === 'navigator') {
            // ビューアーにのみ移動情報を転送
            connectedClients.forEach(socket => {
                if (socket.readyState === WebSocket.OPEN && socket.role === 'viewer') {
                    // 送信者IDと位置情報をそのまま転送
                    socket.send(JSON.stringify(data));
                }
            });
        }
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
      readyPlayersCount = 0;
      connectedClients.forEach(socket => {
        socket.isReady = false;
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'status', message: '相手が切断しました。ゲームを再開するにはもう一度接続してください。' }));
        }
      });
    }
  });

  // エラーが発生したとき
  ws.on('error', (error) => {
    console.error('サーバー: WebSocketエラーが発生しました:', error);
  });
});

// 指定されたポートでサーバーを起動
app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で起動しました。`);
});
