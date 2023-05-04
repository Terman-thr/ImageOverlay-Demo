import ImageOverlay from './ImageOverlay';
import {parts} from "./config";

function App() {
    return (
        <div>
            <ImageOverlay imageUrl="/assets/3000.png" parts={parts} />
        </div>
    );
}

export default App;
