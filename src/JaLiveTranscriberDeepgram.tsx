import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@deepgram/sdk";
import styles from "./JaLiveTranscriberDeepgram.module.css";

const JaLiveTranscriber: React.FC = () => {
    const [finalTranscript, setFinalTranscript] = useState<string[]>([]);
    const [interimTranscript, setInterimTranscript] = useState<string>("");
    const [isRecording, setIsRecording] = useState(false);

    const microphoneRef = useRef<MediaRecorder | null>(null);
    const socketRef = useRef<any>(null);

    // Получаем микрофон
    const getMicrophone = async (): Promise<MediaRecorder> => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return new MediaRecorder(stream);
    };

    // Получаем временный токен от своего сервера
    const getTempToken = async (): Promise<string> => {
        const res = await fetch("https://voice-server-nu.vercel.app/token");
        const json = await res.json();
        return json.access_token;
    };

    // Старт/Стоп записи
    const startRecording = async () => {
        if (!isRecording) {
            // --- Очищаем предыдущий текст при новом старте ---
            setFinalTranscript([]);
            setInterimTranscript("");

            // Создаём микрофон
            microphoneRef.current = await getMicrophone();

            // Создаём новый сокет Deepgram
            const token = await getTempToken();
            const deepgram = createClient({ accessToken: token });
            const socket = deepgram.listen.live({
                model: "nova-3",
                smart_format: true,
                language: "ja-JP",
                interim_results: true,
            });
            socketRef.current = socket;

            // Когда сокет открылся — стартуем микрофон
            socket.on("open", () => {
                console.log("Connected to Deepgram");

                microphoneRef.current!.start(500); // каждый 500ms фрагмент
                microphoneRef.current!.ondataavailable = (e) => {
                    if (e.data.size > 0) socketRef.current?.send(e.data);
                };
                microphoneRef.current!.onstart = () => setIsRecording(true);
                microphoneRef.current!.onstop = () => setIsRecording(false);
            });

            // Обработка результатов
            socket.on("Results", (data: any) => {
                const transcriptText = data.channel.alternatives[0].transcript;
                if (!transcriptText) return;

                if (data.is_final) {
                    setFinalTranscript((prev) => [...prev, transcriptText]);
                    setInterimTranscript("");
                } else {
                    setInterimTranscript(transcriptText);
                }
            });

            socket.on("error", console.error);
            socket.on("warning", console.warn);
            socket.on("close", (e: any) => console.log("Socket closed:", e));
        } else {
            // Стоп записи
            microphoneRef.current?.stop();
            microphoneRef.current = null;

            // Обнуляем ссылку на сокет
            socketRef.current = null;

            setIsRecording(false);
            setInterimTranscript("");
        }
    };


    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            if (microphoneRef.current && microphoneRef.current.state !== "inactive") {
                microphoneRef.current.stop();
            }
            if (socketRef.current) {
                socketRef.current = null; // <- вместо close()
            }
        };
    }, []);

    return (
        <div className={styles.center}>
            <div className={styles.container}>
                <h1 className={styles.title}>Deepgram Live Transcription</h1>
                <button className={styles.button} onClick={startRecording}>
                    {isRecording ? "Stop" : "Record"}
                </button>

                <div className={styles.captions}>
                    <h3>Final transcription:</h3>
                    {finalTranscript.map((text, idx) => (
                        <span key={idx} style={{ color: "black" }}>
                            {text}{" "}
                        </span>
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

