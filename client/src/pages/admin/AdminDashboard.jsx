import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import adminAppointmentService from "../../api/adminAppointmentService";

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

const formatDateTime = (value) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toStatusLabel = (value) => {
  const status = String(value || "pending").toLowerCase();
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const toStatusClass = (value) => {
  const status = String(value || "pending").toLowerCase();

  if (status === "completed") {
    return "bg-green-100 text-green-600";
  }

  if (status === "confirmed") {
    return "bg-blue-100 text-blue-600";
  }

  if (status === "cancelled") {
    return "bg-red-100 text-red-600";
  }

  return "bg-yellow-100 text-yellow-600";
};

const defaultStats = {
  appointmentsToday: 0,
  upcomingAppointments: 0,
  totalAppointments: 0,
  totalDoctors: 0,
  totalPatients: 0,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(defaultStats);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const summary = await adminAppointmentService.getDashboardSummary({ limit: 5 });

        if (!cancelled) {
          setStats(summary.stats);
          setRecentAppointments(summary.recentAppointments);
        }
      } catch (err) {
        if (!cancelled) {
          setStats(defaultStats);
          setRecentAppointments([]);
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard data right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      title: "Appointments Today",
      value: stats.appointmentsToday,
      icon: <CalendarDays size={28} />,
      color: "text-blue-500",
    },
    {
      title: "Upcoming",
      value: stats.upcomingAppointments,
      icon: <UserCheck size={28} />,
      color: "text-purple-500",
    },
    {
      title: "Total Doctors",
      value: stats.totalDoctors,
      icon: <Stethoscope size={28} />,
      color: "text-orange-500",
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: <Users size={28} />,
      color: "text-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
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

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-white p-4 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.05 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 mb-4 ${card.color}`}
            >
              {card.icon}
            </div>
            <h2 className="text-sm text-gray-500">{card.title}</h2>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {loading ? "..." : Number(card.value || 0).toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

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
              {loading ? (
                <tr>
                  <td className="py-4 px-2 text-gray-500" colSpan={5}>
                    Loading recent appointments...
                  </td>
                </tr>
              ) : recentAppointments.length === 0 ? (
                <tr>
                  <td className="py-4 px-2 text-gray-500" colSpan={5}>
                    No appointments found.
                  </td>
                </tr>
              ) : (
                recentAppointments.map((item) => (
                  <tr
                    className="border-b last:border-none hover:bg-gray-50 transition"
                    key={item.id}
                  >
                    <td className="py-4 px-2 font-medium text-gray-700">
                      {item.patientName}
                    </td>
                    <td className="py-4 px-2">{item.doctorName}</td>
                    <td className="py-4 px-2">
                      {item.doctorDepartment || "General"}
                    </td>
                    <td className="py-4 px-2">{formatDateTime(item.appointmentDate)}</td>
                    <td className="py-4 px-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${toStatusClass(
                          item.status,
                        )}`}
                      >
                        {toStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-500">
            {loading
              ? "Loading appointment totals..."
              : `Showing ${recentAppointments.length} of ${Number(stats.totalAppointments || 0).toLocaleString()} appointments`}
          </p>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-all"
              onClick={() => navigate("/admin/all-appointments")}
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
