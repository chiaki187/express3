// ページを開いたときにconnect.htmlでなければ自動でconnect.htmlに遷移
if (window.location.pathname !== '/connect.html') {
  window.location.href = 'connect.html';
}
  // WebSocketサーバーに接続
  const ws = new WebSocket('ws://' + window.location.host + '/ws');

  ws.onmessage = function(event) {
    // サーバーから"done"メッセージを受信したら画面遷移
    if (event.data === "done") {
      window.location.href = "index.html";
    }
  };

  ws.onclose = function() {
    // 接続が解除されたらconnect.htmlへ遷移
    window.location.href = 'connect.html';
  };
