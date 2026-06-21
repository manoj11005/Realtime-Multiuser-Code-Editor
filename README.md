# Realtime Collaborative Code Editor

A real-time, multi-user code editor where multiple people can join the same room and write code together live — like Google Docs, but for code. Built with React, Express, and Socket.io, with live C++ code execution powered by Judge0.

## 🚀 Live Demo

[(https://realtime-multiuser-code-editor.onrender.com)]

## ✨ Features

- **Real-time collaboration** — Multiple users can edit the same code simultaneously, with instant sync across all connected clients
- **Room-based sessions** — Create or join a room using a unique Room ID
- **Live user presence** — See who's currently online in the room
- **Syntax highlighting** — Powered by CodeMirror
- **Run code in real-time** — Execute C++ code with custom input and see output instantly, no local setup required
- **Language sync** — Editor settings stay synced across all users in the room

## 🛠️ Tech Stack

**Frontend**
- React
- CodeMirror (code editor)
- Socket.io Client (real-time communication)
- React Router DOM
- React Hot Toast (notifications)

**Backend**
- Node.js + Express
- Socket.io (WebSocket-based real-time sync)
- Judge0 API (remote code execution — no Docker required)

## 📦 Installation

Clone the repository:

```bash
git clone <your-repo-url>
cd realtime-editor
```

Install dependencies:

```bash
npm install
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_BACKEND_URL=http://localhost:5000
```

> Note: Code execution uses Judge0's free public API (`ce.judge0.com`), which requires no API key.

## 🏃 Running Locally

**Development mode** (frontend only, with hot reload):
```bash
npm run start:front
```

**Production mode** (builds frontend and serves it via the Express server):
```bash
npm start
```

The app will be available at `http://localhost:5000`.

## 🌐 Deployment

This project is deployed on [Render](https://render.com).

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

No additional environment variables are required for code execution since it uses Judge0's free public API.

## 📂 Project Structure

```
realtime-editor/
├── src/
│   ├── components/      # React components (Editor, Sidebar, etc.)
│   ├── pages/            # Page-level components (Home, EditorPage)
│   ├── server.js         # Express + Socket.io backend
│   ├── dockerRunner.js   # Handles code execution via Judge0 API
│   ├── socket.js         # Socket.io client connection setup
│   └── App.js            # Root React component
├── public/
├── package.json
└── README.md
```

## 🧠 How It Works

1. A user creates a room and shares the Room ID with others
2. Other users join using that Room ID
3. Socket.io syncs code changes, cursor activity, and language selection across all connected clients in real time
4. When a user clicks "Run," the code and input are sent to the backend, which forwards them to the Judge0 API for execution
5. The output (or compile/runtime error) is sent back and displayed to all users in the room

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
