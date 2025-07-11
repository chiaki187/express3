
  // WebSocketサーバーに接続
  const ws = new WebSocket('wss://' + window.location.host + '/wss');

  ws.onmessage = function(event) {
    // サーバーから"ready"メッセージを受信したら画面遷移
    if (event.data === "ready") {
      window.location.href = "index.html";
    }else if (event.data === "disconnected") {
    alert("相手が切断しました");
    window.location.href = "connect.html";
    }
  };

  ws.onclose = function() {
    // 接続が解除されたらconnect.htmlへ遷移
    window.location.href = 'connect.html';
  };
