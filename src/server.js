const express = require('express');
const app = express();
const http = require('http');
const { exec } = require("child_process");
const fs = require("fs");
const path = require('path');
const ACTIONS = require('./Actions');
const { Server } = require('socket.io');
const { runCpp } = require('./dockerRunner');

const server = http.createServer(app);
// const io = new Server(server);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Serve React build
// Serve React build
app.use(express.static(path.join(__dirname, '../build')));

// React Router refresh fix
app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

const userSocketMap = {};
const roomState = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        if (roomState[roomId]?.code) {
            socket.emit(
                ACTIONS.CODE_CHANGE,
                { code: roomState[roomId].code }
            );
        }
        
        
        if (roomState[roomId]) {

            socket.emit(
                "SYNC_INPUT",
                roomState[roomId].input || ""
            );

            socket.emit(
                "SYNC_LANGUAGE",
                roomState[roomId].language || "javascript"
            );

            socket.emit(
                "SYNC_OUTPUT",
                roomState[roomId].output || ""
            );
        }
        console.log("ROOM STATE SENT:", roomState[roomId]);
        console.log(
            "CODE LENGTH:",
            roomState[roomId]?.code?.length
        );
        socket.emit("ROOM_STATE", {
            code: roomState[roomId]?.code || "",
            input: roomState[roomId]?.input || "",
            language: roomState[roomId]?.language || "javascript",
            output: roomState[roomId]?.output || "",
        });

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
         console.log("SERVER RECEIVED CODE");
        

        if (!roomState[roomId]) {
            roomState[roomId] = {};
        }

        roomState[roomId].code = code;

        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on("RUN_CODE", async ({ code, input, language }) => {
        console.log("RUN_CODE RECEIVED");
        console.log(language);
        console.log(input);
        try {
            let result = "";

            if (language === "cpp") {
                result = await runCpp(code, input);
            } else {
                result = "Language not supported yet";
            }

            socket.emit("CODE_OUTPUT", result);
        } catch (err) {
            socket.emit("CODE_OUTPUT", err.toString());
        }
    });
    

    socket.on("SYNC_INPUT", ({ roomId, input }) => {

        if (!roomState[roomId]) {
            roomState[roomId] = {};
        }

        roomState[roomId].input = input;

        io.to(roomId).emit("SYNC_INPUT", input);
    });
    socket.on("SYNC_LANGUAGE", ({ roomId, language }) => {

        if (!roomState[roomId]) {
            roomState[roomId] = {};
        }

        roomState[roomId].language = language;

        io.to(roomId).emit("SYNC_LANGUAGE", language);
    });

   socket.on("SYNC_OUTPUT", ({ roomId, output }) => {

        if (!roomState[roomId]) {
            roomState[roomId] = {};
        }

        roomState[roomId].output = output;

        io.to(roomId).emit("SYNC_OUTPUT", output);
    });


    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];

        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });

        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
    console.log(`Listening on port ${PORT}`)
);