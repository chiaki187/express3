const ws = new WebSocket('ws://localhost:3001/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'ready') {
    console.log('クライアント: 接続完了通知');
    document.getElementById('status').textContent = data.text;
  }

  if (data.type === 'game_start') {
    console.log('クライアント: ゲーム開始通知');
    document.getElementById('status').textContent = data.text;
  }

  if (data.type === 'start_game') {
    console.log('クライアント: ゲームが開始されました！');
    document.getElementById('status').textContent = data.message;
  }

  if (data.type === 'error') {
    alert(data.message);
  }
};

document.getElementById('startButton').onclick = () => {
  ws.send(JSON.stringify({ type: 'user_ready', id: 'user123' }));
  console.log('クライアント: スタートボタンを押しました');
  document.getElementById('startButton').style.display = 'none';
};

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
  ;