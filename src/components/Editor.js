import React, { useEffect ,useRef} from 'react'
import Codemirror from 'codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';
const Editor=({socketRef,socketReady,roomId,onCodeChange}) => {
    const editorRef=useRef(null);
    const pendingCodeRef = useRef("");
    useEffect(()=>{
        async function init(){
            editorRef.current=Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: {name:'javascript', json:true},
                    theme:'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets:true,
                    lineNumbers:true,
                }

            );
            if (pendingCodeRef.current) {
                editorRef.current.setValue(
                    pendingCodeRef.current
                );
            }
           

           
            editorRef.current.on('change', (instance, changes) => {

                const { origin } = changes;
                const code = instance.getValue();
                 console.log("SENDING CODE:", code);

                onCodeChange(code);

                if (origin !== 'setValue') {

                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });

                    // localStorage me save
                   
                }
            });
           
            
        }
       

        init();

    },[]);
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

        const handleCodeChange = ({ code }) => {
            console.log("CODE RECEIVED:", code);

            if (code === null || code === undefined) return;

            if (editorRef.current) {
                if (code !== editorRef.current.getValue()) {
                    editorRef.current.setValue(code);
                }
            } else {
                // Editor not mounted yet, stash it for init() to apply
                pendingCodeRef.current = code;
            }
        };

        const handleRoomState = (data) => {
            console.log("ROOM_STATE IN EDITOR", data);

            const code = data?.code || "";

            if (editorRef.current) {
                editorRef.current.setValue(code);
            } else {
                pendingCodeRef.current = code;
            }
        };

        socket.on(ACTIONS.CODE_CHANGE, handleCodeChange);
        socket.on("ROOM_STATE", handleRoomState);

        return () => {
            socket.off(ACTIONS.CODE_CHANGE, handleCodeChange);
            socket.off("ROOM_STATE", handleRoomState);
        };

    }, [socketReady, socketRef]);
    return <textarea id="realtimeEditor"></textarea>
};
export default Editor

























