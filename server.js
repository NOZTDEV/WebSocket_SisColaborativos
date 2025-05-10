const express = require("express"); // Framework para manejar rutas HTTP
const http = require("http"); // Módulo para crear un servidor HTTP
const WebSocket = require("ws"); // Librería para trabajar con WebSockets

const app = express();
const server = http.createServer(app); // Crea un servidor HTTP usando Express
const wss = new WebSocket.Server({ server }); // Crea un servidor WebSocket que se monta sobre el servidor HTTP

const clients = new Map(); // Mapa para almacenar información de cada cliente conectado
let userIdCounter = 0; // Contador para generar IDs únicos de clientes

// Evento que se ejecuta cuando un cliente se conecta al WebSocket
wss.on("connection", (ws) => {
   const clientId = `client_${userIdCounter++}`; // Genera un ID único para el nuevo cliente
   console.log(`Cliente ${clientId} conectado, esperando nombre.`);

   // Evento que maneja los mensajes entrantes desde el cliente
   ws.on("message", (data) => {
      try {
         const msg = JSON.parse(data); // Intenta parsear el mensaje como JSON

         if (msg.type === "join" && msg.username) {
            const username = msg.username.trim();
            if (username) {
               // Guarda los datos del cliente en el mapa
               clients.set(ws, { username: username, id: clientId });
               console.log(`${username} (ID: ${clientId}) se ha unido al chat.`);
               // Notifica a todos los clientes que alguien se ha unido
               broadcast({
                  type: "notification",
                  message: `${username} se ha unido al chat.`,
                  timestamp: new Date().toLocaleTimeString(),
               });
               // Informa al nuevo cliente sobre su identidad asignada
               ws.send(JSON.stringify({ type: "identity", id: clientId, username: username }));
            } else {
               // Si el nombre está vacío, devuelve un error y cierra la conexión
               ws.send(JSON.stringify({ type: "error", message: "Nombre de usuario no puede estar vacío." }));
               ws.close();
            }
         } else if (msg.type === "message" && typeof msg.text === "string") {
            // Manejo de mensajes enviados por los usuarios
            const clientInfo = clients.get(ws);
            if (clientInfo && clientInfo.username) {
               // Reenvía el mensaje a todos los clientes conectados
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
            // Si el mensaje no es válido o no tiene el formato esperado
            console.warn(`Mensaje de tipo desconocido o malformado recibido de ${clientId}:`, msg);
         }
      } catch (error) {
         // Error al parsear o manejar el mensaje
         console.error(`Error procesando mensaje de ${clientId}:`, error, "Data:", data);
         ws.send(JSON.stringify({ type: "error", message: "Hubo un error procesando tu solicitud." }));
      }
   });

   // Evento que se ejecuta cuando un cliente se desconecta
   ws.on("close", () => {
      const clientInfo = clients.get(ws);
      if (clientInfo) {
         clients.delete(ws); // Elimina al cliente del mapa
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

   // Evento que maneja errores de conexión del WebSocket
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

// Función que envía un mensaje a todos los clientes conectados
function broadcast(data) {
   const msgString = JSON.stringify(data); // Convierte el mensaje a texto
   for (const clientWs of clients.keys()) {
      if (clientWs.readyState === WebSocket.OPEN) {
         try {
            clientWs.send(msgString); // Envía el mensaje si la conexión está abierta
         } catch (sendError) {
            console.error("Error enviando mensaje a un cliente:", sendError);
         }
      }
   }
}

app.use(express.static("public")); // Sirve archivos estáticos desde la carpeta "public"

const PORT = process.env.PORT || 3000; // Usa el puerto especificado por el entorno o 3000 por defecto
server.listen(PORT, () => {
   console.log(`Servidor iniciado en http://localhost:${PORT}`);
});