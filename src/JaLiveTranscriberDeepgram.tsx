import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@deepgram/sdk";
import styles from "./JaLiveTranscriberDeepgram.module.css";

const JaLiveTranscriber: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const microphoneRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<any>(null);

    const captionsRef = useRef<HTMLDivElement>(null);

    const getMicrophone = async (): Promise<MediaRecorder> => {
        const userMedia = await navigator.mediaDevices.getUserMedia({ audio: true });
        return new MediaRecorder(userMedia);
    };

    const openMicrophone = async (microphone: MediaRecorder, socket: any) => {
        microphone.start(500);

        microphone.onstart = () => {
            console.log("client: microphone opened");
            setIsRecording(true);
            document.body.classList.add("recording");
        };

        microphone.onstop = () => {
            console.log("client: microphone closed");
            setIsRecording(false);
            document.body.classList.remove("recording");
        };

        microphone.ondataavailable = (e) => {
            const data = e.data;
            console.log("client: sent data to websocket");
            socket.send(data);
        };
    };

    const closeMicrophone = async (microphone: MediaRecorder) => {
        microphone.stop();
    };

    const getTempToken = async (): Promise<string> => {
        const result = await fetch("http://localhost:3000/token");
        const json = await result.json();
        return json.access_token;
    };

    const startRecording = async () => {
        if (!microphoneRef.current) {
            microphoneRef.current = await getMicrophone();
            if (socketRef.current) {
                await openMicrophone(microphoneRef.current, socketRef.current);
            }
        } else {
            await closeMicrophone(microphoneRef.current);
            microphoneRef.current = null;
        }
    };

    const initWebSocket = async () => {
        const token = await getTempToken();
        const deepgram = createClient({ accessToken: token });

        const socket = deepgram.listen.live({ model: "nova-3", smart_format: true, language: "ja-JP", interim_results: true });
        socketRef.current = socket;

        socket.on("open", () => {
            console.log("client: connected to websocket");

            socket.on("Results", (data: any) => {
                const transcriptText = data.channel.alternatives[0].transcript;
                if (transcriptText !== "") setTranscript((prev) => prev + transcriptText);
            });

            socket.on("error", (e: any) => console.error(e));
            socket.on("warning", (e: any) => console.warn(e));
            socket.on("Metadata", (e: any) => console.log(e));
            socket.on("close", (e: any) => console.log(e));
        });
    };

    useEffect(() => {
        initWebSocket();
    }, []);

    return (
        <div className={styles.container}>
            <button className={styles.button} onClick={startRecording}>
                {isRecording ? "Stop" : "Record"}
            </button>
            <div className={styles.captions} ref={captionsRef}>
                {transcript && <span>{transcript}</span>}
            </div>
        </div>
    );
};

export default JaLiveTranscriber;

