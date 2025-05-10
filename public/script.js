const nameModal = document.getElementById("name-modal");
const usernameInput = document.getElementById("username-input");
const joinButton = document.getElementById("join-button");

const chatContainer = document.getElementById("chat-container");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const currentUsernameDisplay = document.getElementById("current-username");

let socket;
let myClientId = null;
let myUsername = "";

function addMessageToChat(data) {
   const messageElement = document.createElement("div");

   const timestamp = data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
   const timestampSpan = document.createElement("span");
   timestampSpan.classList.add("timestamp");
   timestampSpan.textContent = timestamp;

   if (data.type === "message") {
      // Asegurarse de que las propiedades esperadas existan
      const senderName = data.username || "Usuario Desconocido";
      const messageText = typeof data.text === "string" ? data.text : "(mensaje vacío o corrupto)";
      const senderId = data.id;

      messageElement.classList.add("message");
      messageElement.classList.add(senderId === myClientId ? "my-message" : "other-message");

      const senderSpan = document.createElement("span");
      senderSpan.classList.add("sender");
      senderSpan.textContent = (senderId === myClientId ? "Tú" : senderName) + ": ";

      const textSpan = document.createElement("span");
      textSpan.classList.add("text");
      textSpan.textContent = messageText;

      messageElement.appendChild(senderSpan);
      messageElement.appendChild(textSpan);
      messageElement.appendChild(timestampSpan);
   } else if (data.type === "notification") {
      messageElement.classList.add("notification");
      messageElement.textContent = data.message || "Notificación vacía.";
      messageElement.appendChild(timestampSpan);

      if (data.message && data.message.includes("ha salido del chat")) {
         messageElement.style.color = "#aa0000";
      } else if (data.message && data.message.includes("se ha unido al chat")) {
         messageElement.style.color = "#0055aa";
      }
   } else if (data.type === "error") {
      messageElement.classList.add("error");
      messageElement.textContent = `Error del servidor: ${data.message || "Error desconocido."}`;
      messageElement.style.color = "red";
      messageElement.style.fontWeight = "bold";
   } else {
      console.warn("Tipo de mensaje desconocido para renderizar:", data);
      messageElement.classList.add("unknown-message");
      messageElement.textContent = `Mensaje no reconocido: ${JSON.stringify(data)}`;
   }

   chatMessages.appendChild(messageElement);
   chatMessages.scrollTop = chatMessages.scrollHeight;
}

function connectAndJoin() {
   const username = usernameInput.value.trim();
   if (!username) {
      alert("Por favor, ingresa un nombre de usuario.");
      usernameInput.focus();
      return;
   }
   myUsername = username;

   nameModal.style.display = "none";
   chatContainer.style.display = "flex";
   currentUsernameDisplay.textContent = myUsername;
   messageInput.focus();

   socket = new WebSocket(`ws://${location.host}`);

   socket.onopen = () => {
      console.log("Conectado al servidor WebSocket.");
      socket.send(JSON.stringify({ type: "join", username: myUsername }));
   };

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

      if (data.type === "identity") {
         myClientId = data.id;
      } else if (data.type === "message" || data.type === "notification" || data.type === "error") {
         addMessageToChat(data);
      } else {
         console.warn("Tipo de mensaje desconocido o estructura inesperada:", data);
         addMessageToChat({
            type: "error",
            message: `Mensaje de tipo desconocido recibido: ${data.type}`,
         });
      }
   };

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

   socket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      addMessageToChat({
         type: "notification",
         message: "Error de conexión con el chat. Revisa la consola y recarga.",
      });
   };
}

joinButton.addEventListener("click", connectAndJoin);
usernameInput.addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      connectAndJoin();
   }
});

function sendMessage() {
   const text = messageInput.value.trim();
   if (text !== "" && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "message", text: text }));
      messageInput.value = "";
      messageInput.focus();
   }
}

messageInput.addEventListener("keydown", (e) => {
   if (e.key === "Enter") {
      sendMessage();
   }
});
sendButton.addEventListener("click", sendMessage);
