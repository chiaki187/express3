// WebSocketサーバーに接続
const ws = new WebSocket('ws://' + window.location.host + '/ws');

ws.onmessage = function(event) {
  // サーバーから"done"メッセージを受信したら画面遷移
  if (event.data === "done") {
    window.location.href = "index.html";
  }
};

// 通信がcloseした場合にも画面遷移したい場合はこちらを有効化
// ws.onclose = function() {
//   window.location.href = "index.html";
// };
