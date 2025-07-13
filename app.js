const express = require('express');
const expressWs = require('express-ws');

const app = express();
expressWs(app);

const port = process.env.PORT || 3001;
let connects = [];
let start = [];

app.use(express.static('public'));

app.ws('/ws', (ws, req) => {
  connects.push(ws);
  console.log('サーバー: 新しい接続');

  // 2人接続したら ready 信号を送る
  if (connects.length === 2) {
    console.log('サーバー: 2人接続しました。ready信号を送ります。');
    connects.forEach((socket) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({ type: 'ready', text: '接続完了' }));
      }
    });
  }

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    console.log(`サーバー: メッセージ受信: ${data.type}`);

    if (data.type === 'user_ready') {
      if (!start.includes(ws)) {
        start.push(ws);
        console.log(`サーバー: ${start.length}人が準備完了です。`);
      }

      if (start.length === 2) {
        start.forEach((s) => {
          s.send(JSON.stringify({ type: 'game_start', text: 'ゲームを開始します' }));
        });
        console.log('サーバー: ゲーム開始！');
      }
    }

    if (data.type === 'game_start') {
      if (connects.length >= 2) {
        connects.forEach((socket) => {
          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type: 'start_game', message: 'ゲームが開始されました！' }));
          }
        });
      } else {
        ws.send(JSON.stringify({ type: 'error', message: 'プレイヤーが足りません' }));
      }
    }
  });

  ws.on('close', () => {
    connects = connects.filter((conn) => conn !== ws);
    start = start.filter((conn) => conn !== ws);
    console.log('サーバー: 接続が切断されました');
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
