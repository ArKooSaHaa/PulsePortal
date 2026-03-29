import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  UserCheck,
  Stethoscope,
} from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

export default function AdminDashboard() {
  const stats = [
    {
      title: "Appointments Today",
      value: 42,
      icon: <CalendarDays size={28} />,
      color: "text-blue-500",
    },
    {
      title: "Upcoming",
      value: 156,
      icon: <UserCheck size={28} />,
      color: "text-purple-500",
    },
    {
      title: "Total Doctors",
      value: 28,
      icon: <Stethoscope size={28} />,
      color: "text-orange-500",
    },
    {
      title: "Total Patients",
      value: "1,204",
      icon: <Users size={28} />,
      color: "text-green-500",
    },
  ];

  const appointments = [
    {
      name: "James Doe",
      doctor: "Dr. Emily Stone",
      dept: "Cardiology",
      date: "Oct 24, 09:30 AM",
      status: "Completed",
    },
    {
      name: "Sarah Miller",
      doctor: "Dr. Mark Wilson",
      dept: "Neurology",
      date: "Oct 24, 10:15 AM",
      status: "Scheduled",
    },
    {
      name: "Robert Patterson",
      doctor: "Dr. Emily Stone",
      dept: "Cardiology",
      date: "Oct 24, 11:00 AM",
      status: "Cancelled",
    },
    {
      name: "Michael Chen",
      doctor: "Dr. Lisa Wong",
      dept: "Pediatrics",
      date: "Oct 24, 02:30 PM",
      status: "Scheduled",
    },
    {
      name: "Elena Krov",
      doctor: "Dr. Alan Grant",
      dept: "General",
      date: "Oct 24, 03:00 PM",
      status: "Scheduled",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-gray-800">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-2">
          Overview of hospital operations and staff management
        </p>
      </motion.div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 mb-4 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <h2 className="text-sm text-gray-500">{stat.title}</h2>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Recent Appointments */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Appointments
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="text-left py-3 px-2">PATIENT</th>
                <th className="text-left py-3 px-2">DOCTOR</th>
                <th className="text-left py-3 px-2">DEPARTMENT</th>
                <th className="text-left py-3 px-2">DATE & TIME</th>
                <th className="text-left py-3 px-2">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item, i) => (
                <tr
                  className="border-b last:border-none hover:bg-gray-50 transition" key={i}
                >
                  <td className="py-4 px-2 font-medium text-gray-700">
                    {item.name}
                  </td>
                  <td className="py-4 px-2">{item.doctor}</td>
                  <td className="py-4 px-2">{item.dept}</td>
                  <td className="py-4 px-2">{item.date}</td>
                  <td className="py-4 px-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === "Completed"
                          ? "bg-green-100 text-green-600"
                          : item.status === "Scheduled"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-500">
            Showing 5 of 156 appointments
          </p>

          <div className="flex items-center gap-2">
             
             <button className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-all"
               style={{ background: "linear-gradient(to right, #0a5bbf, #127fec)" }}
             >
                View All
              </button>

            
          </div>
        </div>
      </motion.div>
    </div>
  );
}