import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorConsultation from "../pages/doctor/DoctorConsultation";

export const doctorRoutes = [
    { index: true, element: <DoctorDashboard /> },
    { path: "profile", element: <DoctorProfile /> },
    { path: "appointments", element: <DoctorAppointments /> },
    { path: "consultation/:id", element: <DoctorConsultation /> },
];