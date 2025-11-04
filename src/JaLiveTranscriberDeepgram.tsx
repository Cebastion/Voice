import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@deepgram/sdk";
import styles from "./JaLiveTranscriberDeepgram.module.css";

const JaLiveTranscriber: React.FC = () => {
    const [finalTranscript, setFinalTranscript] = useState<string[]>([]); // массив финальных частей
    const [interimTranscript, setInterimTranscript] = useState<string>(""); // текущий interim
    const [isRecording, setIsRecording] = useState(false);
    const microphoneRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<any>(null);

    const getMicrophone = async (): Promise<MediaRecorder> => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return new MediaRecorder(stream);
    };

    const getTempToken = async (): Promise<string> => {
        const res = await fetch("https://voice-server-nu.vercel.app/token");
        const json = await res.json();
        return json.access_token;
    };

    const startRecording = async () => {
        if (!microphoneRef.current) {
            microphoneRef.current = await getMicrophone();
            if (socketRef.current) {
                microphoneRef.current.start(500);
                microphoneRef.current.ondataavailable = (e) => {
                    if (e.data.size > 0) socketRef.current.send(e.data);
                };
                microphoneRef.current.onstart = () => setIsRecording(true);
                microphoneRef.current.onstop = () => setIsRecording(false);
            }
        } else {
            microphoneRef.current.stop();
            microphoneRef.current = null;
            setIsRecording(false);
            setFinalTranscript([]);
            setInterimTranscript("");
        }
    };

    const initWebSocket = async () => {
        const token = await getTempToken();
        const deepgram = createClient({ accessToken: token });

        const socket = deepgram.listen.live({
            model: "nova-3",
            smart_format: true,
            language: "ja-JP",
            interim_results: true,
        });
        socketRef.current = socket;

        socket.on("open", () => {
            console.log("Connected to Deepgram");

            socket.on("Results", (data: any) => {
                const transcriptText = data.channel.alternatives[0].transcript;
                if (!transcriptText) return;

                if (data.is_final) {
                    // Финальная часть
                    setFinalTranscript((prev) => [...prev, transcriptText]);
                    setInterimTranscript(""); // очищаем interim
                } else {
                    // Частичная транскрипция
                    setInterimTranscript(transcriptText);
                }
            });

            socket.on("error", console.error);
            socket.on("warning", console.warn);
            socket.on("close", console.log);
        });
    };

    useEffect(() => {
        initWebSocket();
        return () => {
            if (microphoneRef.current && microphoneRef.current.state !== "inactive") {
                microphoneRef.current.stop();
            }
        };
    }, []);

    return (
        <div className={styles.center}>
            <div className={styles.container}>
                <h1 className={styles.title}>Deepgram</h1>
                <button className={styles.button} onClick={startRecording}>
                    {isRecording ? "Stop" : "Record"}
                </button>

                <div className={styles.captions}>
                    <h3>Final transcription:</h3>
                    {finalTranscript.map((text, index) => (
                        <span key={index} style={{ color: "black" }}>{text}</span>
                    ))}
                </div>

                <div className={styles.captions}>
                    <h3>Partial transcription:</h3>
                    <span style={{ color: "gray" }}>{interimTranscript}</span>
                </div>
            </div>
        </div>
    );
};

export default JaLiveTranscriber;

