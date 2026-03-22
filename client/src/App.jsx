import {
    BrowserRouter,
    Routes,
    Route,
    Outlet,
    Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import authService from "./api/authService";
// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import BookAppointment from "./pages/patient/BookAppointment";
// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorProfile from "./pages/doctor/DoctorProfile";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddDoctor from "./pages/admin/AddDoctor";
import AddAdmin from "./pages/admin/AddAdmin";
import AdminProfile from "./pages/admin/AdminProfile";
function RoleLayout() {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
}

function ProtectedRoute({ expectedRole }) {
    const isLoggedIn = authService.isLoggedIn();
    const user = authService.getCurrentUser();
    if (!isLoggedIn || !user) return <Navigate to="/auth" replace />;
    if (user.role !== expectedRole)
        return <Navigate to={`/${user.role}`} replace />;
    return <Outlet />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/*  PUBLIC  ROUTE   */}
                <Route element={<RoleLayout />}>
                    <Route
                        path="/admin/add-doctor"
                        element={<AddDoctor />}
                    />
                     <Route path="/admin/add-admin" element={<AddAdmin />} /> 
                     <Route path="/doctor/profile" element={<DoctorProfile />} />
                     <Route path="/admin/profile" element={<AdminProfile />} />
                </Route>
                {/* Patient */}
                <Route
                    path="/patient"
                    element={<ProtectedRoute expectedRole="patient" />}
                >
                    <Route element={<RoleLayout />}>
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
                </Route>

                {/* Doctor */}
                <Route
                    path="/doctor"
                    element={<ProtectedRoute expectedRole="doctor" />}
                >
                    <Route element={<RoleLayout />}>
                        <Route index element={<DoctorDashboard />} />
                    </Route>
                </Route>

                {/* Admin */}
                <Route
                    path="/admin"
                    element={<ProtectedRoute expectedRole="admin" />}
                >
                    <Route element={<RoleLayout />}>
                        <Route index element={<AdminDashboard />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
