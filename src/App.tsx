import { NavLink } from "react-router";
import style from "./App.module.css";

const App = () => {
    return (
        <div className={style.center}>
            <h1 className={style.title}>Transcriber Japan</h1>
            <div className={style.buttons}>
                <NavLink className={style.button} to="/deepgram">Deepgram</NavLink>
                <NavLink className={style.button} to="/webspeech">Web Speech API</NavLink>
            </div>
        </div>
    );
}

export default App;
