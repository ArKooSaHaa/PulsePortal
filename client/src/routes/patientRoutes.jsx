import PatientDashboard from "../pages/patient/PatientDashboard";
import PatientAppointments from "../pages/patient/PatientAppointments";
import BookAppointment from "../pages/patient/BookAppointment";

export const patientRoutes = [
    { index: true, element: <PatientDashboard /> },
    { path: "appointments", element: <PatientAppointments /> },
    { path: "book-appointment", element: <BookAppointment /> },
];
