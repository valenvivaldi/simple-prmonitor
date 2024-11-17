
import './App.css'

import PullRequestList from "./components/PullRequestList";


const App = () => {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Pull Request Dashboard</h1>
            <PullRequestList/>
        </div>
    );
};

export default App;