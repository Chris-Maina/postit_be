const WebSocket = require("ws");

const broadcast = (clients, data, action) => {
  clients.forEach((client) => {

    if (client.readyState === WebSocket.OPEN) {

      client.send(JSON.stringify({ post: data, action }));
    }
  });
}

module.exports = { broadcast };