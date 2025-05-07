const chat = document.getElementById('chat');
const input = document.getElementById('input');

// Conexión WebSocket con el servidor
const socket = new WebSocket(`ws://${location.host}`);

// Mostrar mensajes entrantes
socket.onmessage = (event) => { // Que hace cuando llega un mensaje websocket
  const data = JSON.parse(event.data); // Convierte JSON a objeto JS
  const div = document.createElement('div'); // Crea un nuevo div para el mensaje

  if (data.type === 'message') {
    div.textContent = `${data.username}: ${data.message}`;
  } else if (data.type === 'notification') {
    div.textContent = `${data.message}`;
    div.style.fontStyle = 'italic';
    if (data.message.includes('ha salido del chat')) {
      div.style.color = 'red';
    } else {
      div.style.backgroundColor = 'yellow';
    }
  }
  div.style.padding = '5px';

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
};

// Enviar mensaje al presionar Enter
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && input.value.trim() !== '') {
    socket.send(JSON.stringify({ message: input.value }));
    input.value = '';
  }
});
