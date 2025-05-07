const express = require('express'); // Importar express
const http = require('http'); // Importar http
const WebSocket = require('ws'); // Importar ws

const app = express(); // Crear una aplicación express
const server = http.createServer(app); // Crear un servidor HTTP
const wss = new WebSocket.Server({ server }); // Crear un servidor WebSocket

// Mapa para guardar las conexiones y sus nombres de usuario
const clients = new Map();

// Evento: nuevo cliente conectado
wss.on('connection', (ws) => {
  const username = `Usuario_${Math.floor(Math.random() * 1000)}`; 
  clients.set(ws, username); //Guaradar la conexión y el nombre de usuario

  broadcast({ type: 'notification', message: `${username} se ha unido al chat.` });

  // Evento: mensaje recibido desde cliente
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    broadcast({ type: 'message', username, message: msg.message });
  });

  // Evento: cliente se desconecta
  ws.on('close', () => {
    clients.delete(ws);
    broadcast({ type: 'notification', message: `${username} ha salido del chat.` });
  });
});

// Función para enviar un mensaje a todos los clientes
function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg); //Enviar el mensaje a cada cliente conectado
    }
  }
}

// Servir la interfaz web desde la carpeta 'public'
app.use(express.static('public'));

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});