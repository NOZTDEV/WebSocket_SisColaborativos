// Referencias a elementos del DOM relacionados con el nombre de usuario
const nameModal = document.getElementById("name-modal");
const usernameInput = document.getElementById("username-input");
const joinButton = document.getElementById("join-button");

// Referencias a elementos del DOM del chat
const chatContainer = document.getElementById("chat-container");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const currentUsernameDisplay = document.getElementById("current-username");

let socket; // WebSocket para la conexión con el servidor
let myClientId = null; // ID único asignado por el servidor
let myUsername = ""; // Nombre de usuario local

// Función que renderiza mensajes en la interfaz del chat
function addMessageToChat(data) {
   const messageElement = document.createElement("div");

   // Genera una marca de tiempo, ya sea recibida o actual
   const timestamp = data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
   const timestampSpan = document.createElement("span");
   timestampSpan.classList.add("timestamp");
   timestampSpan.textContent = timestamp;

   if (data.type === "message") {
      // Verifica y extrae los campos de mensaje
      const senderName = data.username || "Usuario Desconocido";
      const messageText = typeof data.text === "string" ? data.text : "(mensaje vacío o corrupto)";
      const senderId = data.id;

      // Aplica estilos diferentes según si el mensaje es propio o de otro usuario
      messageElement.classList.add("message");
      messageElement.classList.add(senderId === myClientId ? "my-message" : "other-message");

      const senderSpan = document.createElement("span");
      senderSpan.classList.add("sender");
      senderSpan.textContent = (senderId === myClientId ? "Tú" : senderName) + ": ";

      const textSpan = document.createElement("span");
      textSpan.classList.add("text");
      textSpan.textContent = messageText;

      // Ensambla los elementos del mensaje
      messageElement.appendChild(senderSpan);
      messageElement.appendChild(textSpan);
      messageElement.appendChild(timestampSpan);
   } else if (data.type === "notification") {
      // Muestra notificaciones de conexión/desconexión
      messageElement.classList.add("notification");
      messageElement.textContent = data.message || "Notificación vacía.";
      messageElement.appendChild(timestampSpan);

      // Colorea las notificaciones según el tipo
      if (data.message && data.message.includes("ha salido del chat")) {
         messageElement.style.color = "#aa0000"; // Rojo
      } else if (data.message && data.message.includes("se ha unido al chat")) {
         messageElement.style.color = "#0055aa"; // Azul
      }
   } else if (data.type === "error") {
      // Muestra errores reportados por el servidor
      messageElement.classList.add("error");
      messageElement.textContent = `Error del servidor: ${data.message || "Error desconocido."}`;
      messageElement.style.color = "red";
      messageElement.style.fontWeight = "bold";
   } else {
      // Maneja mensajes inesperados o malformados
      console.warn("Tipo de mensaje desconocido para renderizar:", data);
      messageElement.classList.add("unknown-message");
      messageElement.textContent = `Mensaje no reconocido: ${JSON.stringify(data)}`;
   }

   // Agrega el mensaje al contenedor y hace scroll al final
   chatMessages.appendChild(messageElement);
   chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función que conecta al servidor WebSocket y envía el nombre de usuario
function connectAndJoin() {
   const username = usernameInput.value.trim();
   if (!username) {
      alert("Por favor, ingresa un nombre de usuario.");
      usernameInput.focus();
      return;
   }
   myUsername = username;

   // Oculta el modal de nombre y muestra el chat
   nameModal.style.display = "none";
   chatContainer.style.display = "flex";
   currentUsernameDisplay.textContent = myUsername;
   messageInput.focus();

   // Conecta al WebSocket en el mismo host del servidor
   socket = new WebSocket(`ws://${location.host}`);

   // Una vez conectado, se envía el nombre de usuario
   socket.onopen = () => {
      console.log("Conectado al servidor WebSocket.");
      socket.send(JSON.stringify({ type: "join", username: myUsername }));
   };

   // Procesa los mensajes entrantes desde el servidor
   socket.onmessage = (event) => {
      let data;
      console.log("RAW event.data from server:", typeof event.data, event.data);
      try {
         data = JSON.parse(event.data);
      } catch (error) {
         console.error("Error parseando JSON del servidor:", error, event.data);
         addMessageToChat({
            type: "error",
            message: "Mensaje corrupto recibido (no es JSON válido).",
         });
         return;
      }

      // Identifica el ID propio
      if (data.type === "identity") {
         myClientId = data.id;
      }
      // Procesa tipos de mensajes conocidos
      else if (data.type === "message" || data.type === "notification" || data.type === "error") {
         addMessageToChat(data);
      } else {
         // Muestra error si el tipo no se reconoce
         console.warn("Tipo de mensaje desconocido o estructura inesperada:", data);
         addMessageToChat({
            type: "error",
            message: `Mensaje de tipo desconocido recibido: ${data.type}`,
         });
      }
   };

   // Maneja la desconexión del servidor
   socket.onclose = (event) => {
      console.log("Desconectado del servidor WebSocket.", event.reason);
      addMessageToChat({
         type: "notification",
         message: "Te has desconectado del chat. Intenta recargar la página.",
      });
      messageInput.disabled = true;
      sendButton.disabled = true;
      currentUsernameDisplay.textContent += " (Desconectado)";
   };

   // Maneja errores de conexión
   socket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      addMessageToChat({
         type: "notification",
         message: "Error de conexión con el chat. Revisa la consola y recarga.",
      });
   };
}

// Eventos para iniciar sesión al hacer clic o presionar Enter
joinButton.addEventListener("click", connectAndJoin);
usernameInput.addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      connectAndJoin();
   }
});

// Envía un mensaje si hay texto y el socket está abierto
function sendMessage() {
   const text = messageInput.value.trim();
   if (text !== "" && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "message", text: text }));
      messageInput.value = "";
      messageInput.focus();
   }
}

// Eventos para enviar mensaje con Enter o clic en botón
messageInput.addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      sendMessage();
   }
});
sendButton.addEventListener("click", sendMessage);