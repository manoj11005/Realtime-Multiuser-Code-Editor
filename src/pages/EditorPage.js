














































import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import OutputBox from '../components/OutputBox';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const [socketReady, setSocketReady] = useState(false);
    const location = useLocation();
    const { roomId } = useParams();

    const reactNavigator = useNavigate();

    const [clients, setClients] = useState([]);
    const [output, setOutput] = useState('');
    const [input, setInput] = useState('');
    const [language, setLanguage] = useState("javascript");

    async function runCode() {

    // code empty check
        if (!codeRef.current?.trim()) {
            setOutput("Please write code");
            return;
        }

        // input empty check
        if (!input.trim()) {
            setOutput("Please enter input");
            return;
        }

        setOutput("Running...");

        socketRef.current.emit("RUN_CODE", {
            code: codeRef.current,
            input,
            language,
        });
    }
    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            setSocketReady(true);

            socketRef.current.on('connect_error', (err) =>
                handleErrors(err)
            );

            socketRef.current.on('connect_failed', (err) =>
                handleErrors(err)
            );

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error(
                    'Socket connection failed, try again later.'
                );
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {

                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                    }

                    setClients(clients);

                    socketRef.current.emit(
                        ACTIONS.SYNC_CODE,
                    {
                        socketId,
                        code: codeRef.current || "",
                    }
                );
            }
        );

            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(
                        `${username} left the room.`
                    );

                    setClients((prev) => {
                        return prev.filter(
                            (client) =>
                                client.socketId !== socketId
                        );
                    });
                }
            );

           socketRef.current.on("CODE_OUTPUT", (result) => {
                setOutput(result);

                socketRef.current.emit("SYNC_OUTPUT", {
                    roomId,
                    output: result,
                });
            });

            socketRef.current.on("SYNC_LANGUAGE", (language) => {
                setLanguage(language);
            });

            socketRef.current.on("SYNC_INPUT", (input) => {
                setInput(input);
            });

            socketRef.current.on("SYNC_OUTPUT", (output) => {
                setOutput(output);
            });

            socketRef.current.on("ROOM_STATE", (data) => {

                console.log("ROOM_STATE RECEIVED", data);

                setInput(data.input || "");
                setLanguage(data.language || "javascript");
                setOutput(data.output || "");

                codeRef.current = data.code || "";
            });
           

           

        };

        init();

        return () => {

            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            }

        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(
                roomId
            );

            toast.success(
                'Room ID copied successfully'
            );
        } catch (err) {
            toast.error(
                'Could not copy Room ID'
            );
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>

                    <h3>Connected</h3>

                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={
                                    client.username
                                }
                            />
                        ))}
                    </div>
                </div>

                <button
                    className="btn copyBtn"
                    onClick={copyRoomId}
                >
                    Copy ROOM ID
                </button>

                <button
                    className="btn leaveBtn"
                    onClick={leaveRoom}
                >
                    Leave
                </button>
            </div>

            <div
                className="editorWrap"
                style={{
                    display: 'flex',
                    height: '100%',
                }}
            >
                <div
                    style={{
                        flex: 2,
                        height:'100%',
                        overflow: "hidden"
                    }}
                >
                


                    <select
                        value={language}
                        onChange={(e) => {
                            setLanguage(e.target.value);

                            socketRef.current.emit("SYNC_LANGUAGE", {
                                roomId,
                                language: e.target.value,
                            });
                        }}
                        style={{
                            margin: '10px',
                            padding: '8px',
                            borderRadius: '5px',
                        }}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>

                    <button
                        className="btn copyBtn"
                        onClick={runCode}
                        style={{ margin: '10px' }}
                    >
                        Run Code
                    </button>

                    <Editor
                        socketRef={socketRef}
                        socketReady={socketReady}
                        roomId={roomId}
                        onCodeChange={(code) => {
                            codeRef.current = code;
                        }}
                    />
                </div>
                <div
                    style={{
                        flex: 1,
                        height: "100vh",
                        overflowY: "auto",
                        background: "#1c1e29",
                        borderLeft: "1px solid #333",
                        padding: "10px",
                        boxSizing: "border-box"
                    }}
                >
                <h2 style={{ color: "white" }}>
                    Input
                </h2>

                <textarea
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);

                        socketRef.current.emit("SYNC_INPUT", {
                            roomId,
                            input: e.target.value,
                        });
                    }}
                    style={{
                        width: "100%",
                        height: "150px",
                        background: "#111",
                        color: "white",
                        border: "1px solid #333",
                        padding: "10px",
                        boxSizing: "border-box",
                        resize: "vertical"
                    }}
                />

                <h2
                    style={{
                        color: "white",
                        marginTop: "20px"
                    }}
                >
                    Output
                </h2>

                <OutputBox output={output} />
                </div>
            </div>
        </div>
    );
};

export default EditorPage;



































































 




// import React, { useState, useRef, useEffect } from 'react';
// import toast from 'react-hot-toast';

// import ACTIONS from '../Actions';
// import Client from '../components/Client';
// import Editor from '../components/Editor';
// import OutputBox from '../components/OutputBox';
// import { initSocket } from '../socket';
// import {
//     useLocation,
//     useNavigate,
//     Navigate,
//     useParams,
// } from 'react-router-dom';

// const EditorPage = () => {
//     const socketRef = useRef(null);
//     const codeRef = useRef(null);
//     const [socketReady, setSocketReady] = useState(false);
//     const location = useLocation();
//     const { roomId } = useParams();

//     const reactNavigator = useNavigate();

//     const [clients, setClients] = useState([]);
//     const [output, setOutput] = useState('');
//     const [input, setInput] = useState('');
//     const [language, setLanguage] = useState("javascript");

//     async function runCode() {

//     // code empty check
//         if (!codeRef.current?.trim()) {
//             setOutput("Please write code");
//             return;
//         }

//         // input empty check
//         if (!input.trim()) {
//             setOutput("Please enter input");
//             return;
//         }

//         setOutput("Running...");

//         socketRef.current.emit("RUN_CODE", {
//             code: codeRef.current,
//             input,
//             language,
//         });
//     }
//     useEffect(() => {
//         const init = async () => {
//             socketRef.current = await initSocket();
//             setSocketReady(true);

//             socketRef.current.on('connect_error', (err) =>
//                 handleErrors(err)
//             );

//             socketRef.current.on('connect_failed', (err) =>
//                 handleErrors(err)
//             );

//             function handleErrors(e) {
//                 console.log('socket error', e);
//                 toast.error(
//                     'Socket connection failed, try again later.'
//                 );
//                 reactNavigator('/');
//             }

//             socketRef.current.emit(ACTIONS.JOIN, {
//                 roomId,
//                 username: location.state?.username,
//             });

//             socketRef.current.on(
//                 ACTIONS.JOINED,
//                 ({ clients, username, socketId }) => {

//                     if (username !== location.state?.username) {
//                         toast.success(`${username} joined the room.`);
//                     }

//                     setClients(clients);

//                     socketRef.current.emit(
//                         ACTIONS.SYNC_CODE,
//                     {
//                         socketId,
//                         code: codeRef.current || "",
//                     }
//                 );
//             }
//         );

//             socketRef.current.on(
//                 ACTIONS.DISCONNECTED,
//                 ({ socketId, username }) => {
//                     toast.success(
//                         `${username} left the room.`
//                     );

//                     setClients((prev) => {
//                         return prev.filter(
//                             (client) =>
//                                 client.socketId !== socketId
//                         );
//                     });
//                 }
//             );

//            socketRef.current.on("CODE_OUTPUT", (result) => {
//                 setOutput(result);

//                 socketRef.current.emit("SYNC_OUTPUT", {
//                     roomId,
//                     output: result,
//                 });
//             });

//             socketRef.current.on("SYNC_LANGUAGE", (language) => {
//                 setLanguage(language);
//             });

//             socketRef.current.on("SYNC_INPUT", (input) => {
//                 setInput(input);
//             });

//             socketRef.current.on("SYNC_OUTPUT", (output) => {
//                 setOutput(output);
//             });

//             socketRef.current.on("ROOM_STATE", (data) => {

//                 console.log("ROOM_STATE RECEIVED", data);

//                 setInput(data.input || "");
//                 setLanguage(data.language || "javascript");
//                 setOutput(data.output || "");

//                 codeRef.current = data.code || "";
//             });
           

           

//         };

//         init();

//         return () => {

//             if (socketRef.current) {
//                 socketRef.current.disconnect();
//                 socketRef.current.off(ACTIONS.JOINED);
//                 socketRef.current.off(ACTIONS.DISCONNECTED);
//             }

//         };
//     }, []);

//     async function copyRoomId() {
//         try {
//             await navigator.clipboard.writeText(
//                 roomId
//             );

//             toast.success(
//                 'Room ID copied successfully'
//             );
//         } catch (err) {
//             toast.error(
//                 'Could not copy Room ID'
//             );
//         }
//     }

//     function leaveRoom() {
//         reactNavigator('/');
//     }

//     if (!location.state) {
//         return <Navigate to="/" />;
//     }

//     return (
//         <div className="mainWrap">
//             <div className="aside">
//                 <div className="asideInner">
//                     <div className="logo">
//                         <img
//                             className="logoImage"
//                             src="/code-sync.png"
//                             alt="logo"
//                         />
//                     </div>

//                     <h3>Connected</h3>

//                     <div className="clientsList">
//                         {clients.map((client) => (
//                             <Client
//                                 key={client.socketId}
//                                 username={
//                                     client.username
//                                 }
//                             />
//                         ))}
//                     </div>
//                 </div>

//                 <button
//                     className="btn copyBtn"
//                     onClick={copyRoomId}
//                 >
//                     Copy ROOM ID
//                 </button>

//                 <button
//                     className="btn leaveBtn"
//                     onClick={leaveRoom}
//                 >
//                     Leave
//                 </button>
//             </div>

//             <div
//                 className="editorWrap"
//                 style={{
//                     display: 'flex',
//                     height: '100%',
//                 }}
//             >
//                 <div
//                     style={{
//                         flex: 2,
//                         height:'100%',
//                         overflow: "hidden"
//                     }}
//                 >
                


//                     <select
//                         value={language}
//                         onChange={(e) => {
//                             setLanguage(e.target.value);

//                             socketRef.current.emit("SYNC_LANGUAGE", {
//                                 roomId,
//                                 language: e.target.value,
//                             });
//                         }}
//                         style={{
//                             margin: '10px',
//                             padding: '8px',
//                             borderRadius: '5px',
//                         }}
//                     >
//                         <option value="javascript">JavaScript</option>
//                         <option value="python">Python</option>
//                         <option value="cpp">C++</option>
//                         <option value="java">Java</option>
//                     </select>

//                     <button
//                         className="btn copyBtn"
//                         onClick={runCode}
//                         style={{ margin: '10px' }}
//                     >
//                         Run Code
//                     </button>

//                     <Editor
//                         socketRef={socketRef}
//                         socketReady={socketReady}
//                         roomId={roomId}
//                         onCodeChange={(code) => {
//                             codeRef.current = code;
//                         }}
//                     />
//                 </div>

//                 <div
//                     style={{
//                         flex: 1,
//                         height: "100vh",
//                         overflow: "auto"
//                     }}
//                 >
//                     <textarea
//                         placeholder="Enter Input"
//                         value={input}
//                         onChange={(e) => {
//                             setInput(e.target.value);

//                             socketRef.current.emit("SYNC_INPUT", {
//                                 roomId,
//                                 input: e.target.value,
//                             });
//                         }}
//                         style={{
//                             width: '95%',
//                             height: '100px',
//                             margin: '10px',
//                             background: '#1e1e1e',
//                             color: 'white',
//                             border: '1px solid #333',
//                             padding: '10px',
//                             borderRadius: '5px',
//                         }}
//                     />
//                     <OutputBox output={output} />
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default EditorPage;

















