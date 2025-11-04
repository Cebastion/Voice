import React, { useEffect, useState, useRef } from "react";
import styles from "./JaLiveTranscriber.module.css";

const JaLiveTranscriberWebSpeechAPI: React.FC = () => {
    const [transcript, setTranscript] = useState<string>("");
    const [isListening, setIsListening] = useState<boolean>(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Ваш браузер не поддерживает Web Speech API");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "ja-JP";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setTranscript(finalTranscript + interimTranscript);
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
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.heading}>Живая транскрипция на русский:</h2>
            <p className={styles.transcript}>{transcript}</p>
            <button className={styles.button} onClick={toggleListening}>
                {isListening ? "Остановить" : "Начать"}
            </button>
        </div>
    );
};

export default JaLiveTranscriberWebSpeechAPI;

