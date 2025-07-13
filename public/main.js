const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)


app.use(express.static('public'))

app.ws('/ws', (ws, req) => {
  connects.push(ws)
 // 2人接続したら、ゲーム開始準備の信号を送る
  if (connects.length === 2) {
    console.log('サーバー: 2人接続しました。ready信号を送ります。');
    connects.forEach((socket) => {
      if (socket.readyState === 1) {
        console.log('サーバー：ready信号を送ったよ。');
        socket.send(JSON.stringify({ type: 'ready', text: '接続完了' }))
      }
    })
}

if (data.type === 'user_ready') { //ユーザーがゲーム開始ボタンを押したら
  if (!start.includes(socket)) {
  start.push(socket); // socket を追加
  console.log(`サーバー: ${start.length}人が準備完了です。`);
  }
  if (start.length === 2) { // 2人が準備完了したら
    start.forEach((s) => {
      s.send(JSON.stringify({ type: 'game_start', text: 'ゲームを開始します' }));
    });
    console.log('サーバー: 2人が準備完了。ゲームを開始します。');
  }
}

//サーバーからメッセージを送信
  ws.on('message', (message) => {
    // ★クライアントから 'game_start' メッセージを受信した場合★
    if (data.type === 'game_start') {
      console.log(`ゲーム開始リクエストを受信: ${data.text}`);
      // 2人以上のプレイヤーが接続している場合のみゲームを開始
      if (connects.length >= 2) {
        connects.forEach((socket) => {
          if (socket.readyState === 1) {
            // 全員にゲーム開始を通知
            socket.send(JSON.stringify({ type: 'start_game', message: 'ゲームが開始されました！' }));
          }
        });
        console.log('ゲーム開始！');
      } else {
        // プレイヤーが足りない場合、送信元にエラーを通知
        ws.send(JSON.stringify({ type: 'error', message: 'ゲームを開始するには2人のプレイヤーが必要です。' }));
      }
    } 
  })