import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/Navbar";
import { roleRoutes } from "./config/roleRoutes";
import HomePage from "./pages/HomePage";

// Layout wraps navbar + child component
function RoleLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
            <BrowserRouter>
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/home" element={<HomePage />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/:role" element={<RoleLayout />}>
                    {Object.entries(roleRoutes).map(([role, routes]) =>
                        routes.map((route) => (
                            <Route
                                key={`${role}-${route.path}`}
                                path={route.path}
                                element={route.element}
                            />
                        )),
                    )}
                </Route>

                <Route path="/auth" element={<AuthPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
