const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connects = []
let start = []

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

  socket.on('message', (message) => {
  const data = JSON.parse(message)
  console.log(`サーバー: メッセージを受信: ${data.text}`)
  // メッセージの種類によって処理を分ける
  })
  


  //サーバーからメッセージを送信
  ws.on('message', (message) => {
    // メッセージを送信者以外に転送
    connects.forEach((socket) => {
      if (socket !== ws && socket.readyState === 1) {
        socket.send(message)
      }
    })
  })

  ws.on('close', () => {
    connects = connects.filter((conn) => conn !== ws)
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
