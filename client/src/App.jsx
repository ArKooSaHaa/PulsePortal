import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import BookAppointment from "./pages/patient/BookAppointment";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";

function RoleLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Patient Pages */}
                <Route path="/patient/*" element={<RoleLayout />}>
                    <Route index element={<PatientDashboard />} />
                    <Route
                        path="appointments"
                        element={<PatientAppointments />}
                    />
                    <Route
                        path="book-appointment"
                        element={<BookAppointment />}
                    />
                </Route>

                {/* Doctor Pages */}
                <Route path="/doctor/*" element={<RoleLayout />}>
                    <Route index element={<DoctorDashboard />} />
                </Route>

                {/* Admin Pages */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;
