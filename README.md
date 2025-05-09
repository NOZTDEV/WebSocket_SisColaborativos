
# 💬 WebSocket SisColaborativos

Este es un sistema básico de chat colaborativo en tiempo real desarrollado con **Node.js** y **WebSocket**, como parte de un ejercicio educativo para comprender la comunicación bidireccional persistente entre cliente y servidor sin usar técnicas tradicionales como polling o long-polling.

## 🚀 Funcionalidades

- Comunicación en tiempo real entre múltiples usuarios usando WebSocket.
- Asignación automática de nombres temporales (ej: `Usuario_123`) si no se proporciona uno.
- Historial de mensajes visible en el cliente.
- Notificación al resto de usuarios cuando alguien entra o sale del chat.
- Interfaz cliente web accesible desde cualquier dispositivo en la misma red.

---

## 🛠️ Tecnologías utilizadas

- [Node.js](https://nodejs.org/)
- [WebSocket (ws)](https://github.com/websockets/ws)
- HTML, CSS, JavaScript

---

## 📦 Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/NOZTDEV/WebSocket_SisColaborativos.git
cd WebSocket_SisColaborativos
```

2. Instala las dependencias:

```bash
npm install
```

3. Ejecuta el servidor:

```bash
node server.js
```

El servidor iniciará en `http://localhost:3000`

---

## 📱 Probar desde otro dispositivo (misma red local)

1. Asegúrate de que tu PC y tu celular estén en la misma red WiFi.
2. Descubre tu IP local en el PC:

```bash
ip a        # Linux
ipconfig    # Windows
```

3. En tu celular, abre el navegador y escribe la IP local del servidor + puerto, por ejemplo:

```
http://192.168.0.104:3000
```

---

## ✨ Uso

1. Al cargar la página, se te asignará un nombre de usuario temporal.
2. Escribe un mensaje y presiona Enter para enviarlo.
3. Verás el historial de mensajes, conexiones y desconexiones.
4. Para ver las desconecciones refresca la página y tambien se unira con otro nombre de usaurio.

---

## 📁 Estructura del proyecto

```
WebSocket_SisColaborativos/
│
├── public/
│   ├── index.html        # Interfaz web del cliente
│   ├── styles.css        # Estilos básicos
│   └── client.js         # Lógica WebSocket del cliente
│
├── server.js             # Servidor WebSocket con Node.js
├── package.json          # Dependencias y scripts
└── README.md             # Este archivo
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
