import { createBrowserRouter } from "react-router";
import JaLiveTranscriberDeepgram from "../JaLiveTranscriberDeepgram";
import JaLiveTranscriberWebSpeechAPI from "../JaLiveTranscriberWebSpeechAPI";
import App from "../App";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/deepgram",
        element: <JaLiveTranscriberDeepgram />,
    },
    {
        path: "/webspeech",
        element: <JaLiveTranscriberWebSpeechAPI />,
    }
]);


export default router;
