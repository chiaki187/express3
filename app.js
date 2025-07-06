const express = require('express')
const expressWs = require('express-ws')

const app = express()
expressWs(app)

const port = process.env.PORT || 3001
let connects = []

app.use(express.static('public'))

app.ws('/ws', (ws, req) => {// WebSocket endpoint
 
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

// ルートアクセス時はconnect.htmlへリダイレクト
app.get('/', (req, res) => {
  res.redirect('/connect.html');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})