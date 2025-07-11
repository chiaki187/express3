const express = require('express');
const expressWs = require('express-ws'); // express-ws モジュールをインポート

const app = express();
const wsInstance = expressWs(app); // expressWs を初期化し、返り値を受け取る

const port = process.env.PORT || 3001;
let connects = []; // 接続しているクライアントを保持する配列

// public ディレクトリ内の静的ファイルを配信
app.use(express.static('public'));

// WebSocketエンドポイントの定義
// app.ws('/ws', (ws, req) => { ... }); のコールバック関数内でのみ `ws` 変数が有効です。
app.ws('/ws', (ws, req) => {
  // 新しいWebSocket接続が確立されたら、connects配列に追加
  connects.push(ws);
  console.log(`Client connected. Total connections: ${connects.length}`);

  // メッセージ受信時のイベントハンドラ
  ws.on('message', (message) => {
    console.log('Received:', message.toString()); // message はBufferの場合があるのでtoString()を使う

    // 全ての接続済みクライアントにメッセージをブロードキャスト
    // ただし、接続がまだ開いている (readyState === 1) ソケットのみに送信
    connects.forEach((socket) => {
      if (socket.readyState === wsInstance.get ){ // WebSocket.OPEN) { // ws.OPEN はブラウザ側の定数なので、Node.jsでは数値の1
        socket.send(message);
      }
    });
  });

  // 接続が閉じられた時のイベントハンドラ
  ws.on('close', () => {
    // connects配列から切断されたソケットを削除
    connects = connects.filter((conn) => conn !== ws);
    console.log(`Client disconnected. Total connections: ${connects.length}`);
  });

  // エラー発生時のイベントハンドラ (追加することを推奨)
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error}`);
  });
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});