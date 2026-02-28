// Placeholder pages - replace with actual components later
// import PatientAppointments from "../pages/patient/PatientAppointments";
// import PatientHistory from "../pages/patient/PatientHistory";
// import BookAppointment from "../pages/patient/BookAppointment";
// import DoctorAppointments from "../pages/doctor/DoctorAppointments";
// import DoctorPatients from "../pages/doctor/DoctorPatients";
// import AdminDashboard from "../pages/admin/AdminDashboard";
// Will import all the dashboards here
import DoctorDashboard from "../pages/DoctorDashboard";
import AdminDashboard from "../pages/AdminDashboard";

export const roleRoutes = {
    patient: [
        {
            path: "appointments",
            element: (
                <div className="p-8">
                    <h1 className="text-2xl font-bold">My Appointments</h1>
                </div>
            ),
        },
        {
            path: "history",
            element: (
                <div className="p-8">
                    <h1 className="text-2xl font-bold">History</h1>
                </div>
            ),
        },
        {
            path: "book-appointment",
            element: (
                <div className="p-8">
                    <h1 className="text-2xl font-bold">Book Appointment</h1>
                </div>
            ),
        },
    ],
    doctor: [
         {
      path: "",
      element: <DoctorDashboard />,
         },
        {
            path: "doc-appointments",
            element: (
                <div className="p-8">
                    <h1 className="text-2xl font-bold">Doctor Appointments</h1>
                </div>
            ),
        },
        {
            path: "doc-patients",
            element: (
                <div className="p-8">
                    <h1 className="text-2xl font-bold">Patients</h1>
                </div>
            ),
        },
    ],
    admin: [

        
  
         {
            // path: " ",
           // element: (
             //  <div className="p-8">
              //      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
               // </div>
           // ),
         },
    ],
};
