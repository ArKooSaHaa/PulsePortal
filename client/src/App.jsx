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
import ProfilePage from "./pages/ProfilePage";
// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddDoctor from "./pages/admin/AddDoctor";
import AddAdmin from "./pages/admin/AddAdmin";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminAppointments from "./pages/admin/AdminAppointments";

function normalizeAdminRole(role) {
    const value = String(role || "")
        .trim()
        .toLowerCase();

    if (["super", "super admin", "super-admin", "super_admin"].includes(value)) {
        return "super";
    }

    if (value === "manager") {
        return "manager";
    }

    if (value === "hr") {
        return "hr";
    }

    return "unknown";
}

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

function AdminRoleRoute({ allowedRoles, element }) {
    const isLoggedIn = authService.isLoggedIn();
    const user = authService.getCurrentUser();

    if (!isLoggedIn || !user) {
        return <Navigate to="/auth" replace />;
    }

    if (user.role !== "admin") {
        return <Navigate to={`/${user.role}`} replace />;
    }

    const normalizedAdminRole = normalizeAdminRole(user.admin_role);

    if (!allowedRoles.includes(normalizedAdminRole)) {
        return <Navigate to="/admin" replace />;
    }

    return element;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />

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
                        <Route path="profile" element={<ProfilePage />} />
                    </Route>
                </Route>

                {/* Doctor */}
                <Route
                    path="/doctor"
                    element={<ProtectedRoute expectedRole="doctor" />}
                >
                    <Route element={<RoleLayout />}>
                        <Route index element={<DoctorDashboard />} />
                        <Route
                            path="doc-appointments"
                            element={<DoctorAppointments />}
                        />
                        <Route path="profile" element={<DoctorProfile />} />
                    </Route>
                </Route>

                {/* Admin */}
                <Route
                    path="/admin"
                    element={<ProtectedRoute expectedRole="admin" />}
                >
                    <Route element={<RoleLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route
                            path="add-doctor"
                            element={
                                <AdminRoleRoute
                                    allowedRoles={["super", "manager"]}
                                    element={<AddDoctor />}
                                />
                            }
                        />
                        <Route
                            path="add-admin"
                            element={
                                <AdminRoleRoute
                                    allowedRoles={["super"]}
                                    element={<AddAdmin />}
                                />
                            }
                        />
                        <Route
                            path="all-appointments"
                            element={<AdminAppointments />}
                        />
                        <Route path="profile" element={<AdminProfile />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
