import './App.scss';
import {useSelector} from "react-redux";
import LoginView from "./LoginView";
import MainView from "./MainView";


function App() {

    const lastError = useSelector(state => state.session.lastError);
    const token = useSelector(state => state.session.token);
    const data = useSelector(state => state.session.data);

    console.log({ lastError, token, data })

    // If the token is saved and validated, show the redeem list
    if (!lastError && token && token.access_token && data && data.user_id) {
        // app is fully ready
        return <MainView/>;
    }

    // No token or error - show login page
    return (
        <LoginView />
    );
}

export default App;
