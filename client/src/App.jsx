import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/Navbar";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/:role" element={<Navbar />} />
                    <Route path="/auth" element={<AuthPage />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
