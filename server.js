const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();
let userIdCounter = 0;

wss.on("connection", (ws) => {
   const clientId = `client_${userIdCounter++}`;
   console.log(`Cliente ${clientId} conectado, esperando nombre.`);

   ws.on("message", (data) => {
      try {
         const msg = JSON.parse(data);

         if (msg.type === "join" && msg.username) {
            const username = msg.username.trim();
            if (username) {
               clients.set(ws, { username: username, id: clientId });
               console.log(`${username} (ID: ${clientId}) se ha unido al chat.`);
               broadcast({
                  type: "notification",
                  message: `${username} se ha unido al chat.`,
                  timestamp: new Date().toLocaleTimeString(),
               });
               ws.send(JSON.stringify({ type: "identity", id: clientId, username: username }));
            } else {
               ws.send(JSON.stringify({ type: "error", message: "Nombre de usuario no puede estar vacío." }));
               ws.close();
            }
         } else if (msg.type === "message" && typeof msg.text === "string") {
            const clientInfo = clients.get(ws);
            if (clientInfo && clientInfo.username) {
               broadcast({
                  type: "message",
                  username: clientInfo.username,
                  id: clientInfo.id,
                  text: msg.text,
                  timestamp: new Date().toLocaleTimeString(),
               });
            } else {
               console.warn(`Mensaje de tipo 'message' recibido de cliente no identificado o sin texto: ${clientId}`);
            }
         } else {
            console.warn(`Mensaje de tipo desconocido o malformado recibido de ${clientId}:`, msg);
         }
      } catch (error) {
         console.error(`Error procesando mensaje de ${clientId}:`, error, "Data:", data);
         ws.send(JSON.stringify({ type: "error", message: "Hubo un error procesando tu solicitud." }));
      }
   });

   ws.on("close", () => {
      const clientInfo = clients.get(ws);
      if (clientInfo) {
         clients.delete(ws);
         console.log(`${clientInfo.username} (ID: ${clientInfo.id}) ha salido del chat.`);
         broadcast({
            type: "notification",
            message: `${clientInfo.username} ha salido del chat.`,
            timestamp: new Date().toLocaleTimeString(),
         });
      } else {
         console.log(`Cliente ${clientId} desconectado antes de unirse formalmente.`);
      }
   });

   ws.on("error", (error) => {
      console.error(`Error en WebSocket para cliente ${clientId}:`, error);
      const clientInfo = clients.get(ws);
      if (clientInfo) {
         clients.delete(ws);
         broadcast({
            type: "notification",
            message: `${clientInfo.username} se ha desconectado debido a un error.`,
            timestamp: new Date().toLocaleTimeString(),
         });
      }
   });
});

function broadcast(data) {
   const msgString = JSON.stringify(data);
   for (const clientWs of clients.keys()) {
      if (clientWs.readyState === WebSocket.OPEN) {
         try {
            clientWs.send(msgString);
         } catch (sendError) {
            console.error("Error enviando mensaje a un cliente:", sendError);
         }
      }
   }
}

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
   console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
