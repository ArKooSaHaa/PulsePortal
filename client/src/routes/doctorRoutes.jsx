import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorProfile from "../pages/doctor/DoctorProfile";

export const doctorRoutes = [
    { index: true, element: <DoctorDashboard /> },
    { path: "profile", element: <DoctorProfile /> },
];