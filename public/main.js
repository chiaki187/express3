// WebSocketサーバーに接続
const ws = new WebSocket('ws://' + window.location.host + '/ws');

ws.onmessage = function(event) {
  // サーバーから"done"メッセージを受信したら画面遷移
  if (event.data === "done") {
    window.location.href = "index.html";
  }
};

// 通信がcloseした場合にも画面遷移したい場合はこちらを有効化
  ws.onclose = function() {
  window.location.href = "connect.html";
  };

  const express = require('express')
  const expressWs = require('express-ws')
  
  const app = express()
  expressWs(app)
  
  const port = process.env.PORT || 3001
  let connects = []
  
  app.use(express.static('public'))
  
  app.ws('/ws', (ws, req) => {　// WebSocket endpoint
   
    connects.push(ws)
  
    ws.on('message', (message) => {
      console.log('Received:', message)
  
      connects.forEach((socket) => {
        if (socket.readyState === 1) {
          // Check if the connection is open
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