const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connects = []

app.ws('/wss', (ws, req) => {// WebSocket endpoint
 
  connects.push(ws)

   if (connects.length === 2) {
    connects.forEach(socket => {
      if (socket.readyState === 1) {
        socket.send('ready');
      }
    });
  }

   ws.send('ready')
  
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
   // 相手に「切断された」ことを通知
    connects.forEach(socket => {
      if (socket.readyState === 1) {
        socket.send('disconnected');
      }
    });
  });
});

// 静的ファイル配信
app.use(express.static('public'));

// ルートアクセス時はconnect.htmlへリダイレクト
app.get('/', (req, res) => {
  res.redirect('/connect.html');
});

app.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`)
})

 setInterval(() => {
  console.log(`[WebSocket] 現在の接続数: ${connects.length}`);
}, 10000); // 10秒ごと


  