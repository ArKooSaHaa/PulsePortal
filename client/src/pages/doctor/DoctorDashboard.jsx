import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../api/authService";
import doctorAppointmentService from "../../api/doctorAppointmentService";

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      setLoading(true);
      setError("");

      try {
        const rows = await doctorAppointmentService.getMyAppointments();
        if (!cancelled) {
          setAppointments(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setAppointments([]);
          setError(
            err.response?.data?.message ||
              "Unable to load doctor appointment data right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, []);

  const user = authService.getCurrentUser();
  const doctorDisplayName = user?.name ? `Dr. ${user.name}` : "Doctor";

  const todayKey = new Date().toDateString();

  const appointmentsToday = useMemo(
    () =>
      appointments.filter((item) => {
        const date = new Date(item.appointmentDate);
        return !Number.isNaN(date.getTime()) && date.toDateString() === todayKey;
      }),
    [appointments, todayKey],
  );

  const upcomingAppointments = useMemo(
    () => appointments.filter((item) => new Date(item.appointmentDate) > new Date()),
    [appointments],
  );

  const scheduleRows = useMemo(
    () =>
      [...appointmentsToday]
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        )
        .slice(0, 6),
    [appointmentsToday],
  );

  const completionRate = useMemo(() => {
    if (!appointments.length) {
      return 0;
    }

    const completed = appointments.filter(
      (item) => String(item.status).toLowerCase() === "completed",
    ).length;

    return Math.round((completed / appointments.length) * 100);
  }, [appointments]);

  const formatTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "--:--";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toVisitTypeLabel = (value) => {
    const type = String(value || "in-person").toLowerCase();
    return type === "online" ? "Online" : "In-Person";
  };

  const toStatusLabel = (value) => {
    const status = String(value || "pending").toLowerCase();
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Good Morning, {doctorDisplayName}
          </h1>
          <p className="text-slate-500 mt-1">
            You have <span className="text-[#0a5bbf] font-semibold">{appointmentsToday.length} appointments</span> scheduled for today.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/doctor/doc-appointments")}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold shadow-md"
          style={{
            background: "linear-gradient(135deg, #127fec, #0a5bbf)",
          }}
        >
          <Plus size={18} />
          Manage Appointments
        </motion.button>
      </motion.div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-white p-4 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Appointments Today",
                value: loading ? "..." : appointmentsToday.length,
                icon: <Calendar size={22} />,
              },
              {
                title: "Upcoming",
                value: loading ? "..." : upcomingAppointments.length,
                icon: <Users size={22} />,
              },
              
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="p-3 bg-[#127fec]/10 text-[#0a5bbf] rounded-xl">
                    {item.icon}
                  </div>
                </div>
                <p className="text-slate-500 text-sm">{item.title}</p>
                <h2 className="text-3xl font-bold text-slate-800 mt-1">
                  {item.value}
                </h2>
              </motion.div>
            ))}
          </div>

          {/* Schedule */}
         {/* Schedule Table */}
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
>
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-lg font-semibold text-slate-800">
      Today’s Schedule
    </h2>
    <button className="text-[#127fec] text-sm font-medium hover:underline">
      View Calendar
    </button>
  </div>

  {/* Header Row */}
  <div className="grid grid-cols-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3 mb-4">
    <div>Time</div>
    <div>Patient Name</div>
    <div>Type</div>
    <div>Status</div>
  </div>

  {/* Data Rows */}
  <div className="space-y-3">
    {loading ? (
      <div className="text-sm text-slate-500 py-4">Loading today schedule...</div>
    ) : scheduleRows.length === 0 ? (
      <div className="text-sm text-slate-500 py-4">No appointments scheduled for today.</div>
    ) : scheduleRows.map((item) => (
      <motion.div
        key={item.id}
        whileHover={{ backgroundColor: "#f8fafc" }}
        className="grid grid-cols-4 items-center p-4 rounded-xl border border-slate-100 transition"
      >
        <div className="font-medium text-slate-700">
          {formatTime(item.appointmentDate)}
        </div>

       
           {/* Patient with Avatar */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
            {(item.patientName || "P").charAt(0)}
          </div>
          <span className="text-slate-600 font-medium">
            {item.patientName}
          </span>
        </div>

        <div className="text-slate-500 text-sm">
          {toVisitTypeLabel(item.appointmentType)}
        </div>
        
        <div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              String(item.status).toLowerCase() === "completed"
                ? "bg-green-100 text-green-600"
                : String(item.status).toLowerCase() === "pending"
                ? "bg-yellow-100 text-yellow-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            {toStatusLabel(item.status)}
          </span>
        </div>
      </motion.div>
    ))}
  </div>
</motion.div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            className="rounded-2xl p-6 text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #0a5bbf, #127fec)",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-medium">Weekly Efficiency</p>
              <TrendingUp size={20} />
            </div>
            <h2 className="text-4xl font-bold">{loading ? "--" : `${completionRate}%`}</h2>
            <p className="text-sm opacity-90 mt-2">
              Completion rate based on your appointment history.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}