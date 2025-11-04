import React, { useEffect, useState, useRef } from "react";
import styles from "./JaLiveTranscriber.module.css";

const JaLiveTranscriberWebSpeechAPI: React.FC = () => {
    const [finalTranscript, setFinalTranscript] = useState<string[]>([]); // финальный текст
    const [interimTranscript, setInterimTranscript] = useState<string>(""); // текущий interim
    const [isListening, setIsListening] = useState<boolean>(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Ваш браузер не поддерживает Web Speech API");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "ja-JP";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
            // Берем последнюю часть
            const lastResult = event.results[event.results.length - 1];

            if (lastResult.isFinal) {
                // Сразу добавляем финальную часть в массив финальных
                setFinalTranscript((prev) => [...prev, lastResult[0].transcript]);
                setInterimTranscript(""); // очищаем интерим
            } else {
                // Обновляем нижний блок текущей частью
                setInterimTranscript(lastResult[0].transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event);
        };

        recognitionRef.current = recognition;
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
            setFinalTranscript([]); // очищаем старое
            setInterimTranscript(""); // очищаем старое
        }
    };

    return (
        <div className={styles.center}>
            <div className={styles.container}>
                <h1 className={styles.title}>Web Speech API</h1>
                <button className={styles.button} onClick={toggleListening}>
                    {isListening ? "Stop" : "Record"}
                </button>

                <div className={styles.transcript}>
                    <h3>Final transcription:</h3>
                    {finalTranscript.map((text, index) => (
                        <span key={index} style={{ color: "black" }}>
                            {text}
                        </span>
                    ))}
                </div>

                <div className={styles.transcript}>
                    <h3>Partial transcription:</h3>
                    <span style={{ color: "gray" }}>{interimTranscript}</span>
                </div>
            </div>
        </div>
    );
};

export default JaLiveTranscriberWebSpeechAPI;

