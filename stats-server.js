const http = require('http');
const express = require('express');
const {Server} = require('socket.io');

class StatsServer {
  init(player) {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    const PORT = process.env.PORT || 3000;

    io.on('connection', (socket) => {
      const data = Object.fromEntries(
        Object.entries(player)
          .filter(([key]) => key[0] !== '_')
      );

      socket.emit('stats', data);

      socket.on('toggle', () => {
        player.toggle();
        socket.emit('propertyChanged', {property: 'isPlaying', value: player.isPlaying});
      });

      player.on('propertyChanged', socket.emit.bind(socket, 'propertyChanged'));
      player.on('elementPushed', socket.emit.bind(socket, 'elementPushed'));
    });

    app.use(express.static('public'));

    server.listen(PORT, () => {
      console.log(`Stats server listening on http://localhost:${PORT}`)
    });
  }
}

module.exports = new StatsServer();

