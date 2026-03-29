import AdminDashboard from "../pages/admin/AdminDashboard";
import AddDoctor from "../pages/admin/AddDoctor";
import AddAdmin from "../pages/admin/AddAdmin";
import AdminProfile from "../pages/admin/AdminProfile";

export const adminRoutes = [
    { index: true, element: <AdminDashboard /> },
    { path: "add-doctor", element: <AddDoctor /> },
    { path: "add-admin", element: <AddAdmin /> },
    { path: "profile", element: <AdminProfile /> },
];
