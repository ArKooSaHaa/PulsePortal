import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BedDouble,
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
  const [appointmentsToday, setAppointmentsToday] = useState([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [roomAdmissionStats, setRoomAdmissionStats] = useState({
    activeRoomAdmissions: 0,
    totalRoomAdmissions: 0,
  });
  const [doctorRoomAdmissions, setDoctorRoomAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      setLoading(true);
      setError("");

      try {
        const [rows, upcomingRows, todayRows, roomSummary] = await Promise.all([
          doctorAppointmentService.getMyAppointments(),
          doctorAppointmentService.getMyAppointments({ scope: "upcoming" }),
          doctorAppointmentService.getMyAppointments({ scope: "today" }),
          doctorAppointmentService.getRoomAdmissionsSummary({ limit: 4 }),
        ]);

        if (!cancelled) {
          setAppointments(rows);
          setAppointmentsToday(todayRows);
          setUpcomingCount(upcomingRows.length);
          setRoomAdmissionStats(roomSummary.stats);
          setDoctorRoomAdmissions(roomSummary.roomAdmissions);
        }
      } catch (err) {
        if (!cancelled) {
          setAppointments([]);
          setAppointmentsToday([]);
          setUpcomingCount(0);
          setRoomAdmissionStats({ activeRoomAdmissions: 0, totalRoomAdmissions: 0 });
          setDoctorRoomAdmissions([]);
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

  const toRoomStatusClass = (value) => {
    const status = String(value || "admitted").toLowerCase();

    if (status === "discharged") {
      return "bg-slate-100 text-slate-600";
    }

    return "bg-emerald-100 text-emerald-700";
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "Not set";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Not set";
    }

    return date.toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                onClick: () => navigate("/doctor/doc-appointments?scope=today"),
                helper: "View today details",
              },
              {
                title: "Upcoming",
                value: loading ? "..." : upcomingCount,
                icon: <Users size={22} />,
                onClick: () => navigate("/doctor/doc-appointments?scope=upcoming"),
                helper: "View upcoming details",
              },
              
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                custom={i}
                whileHover={{ y: -5 }}
                onClick={item.onClick}
                onKeyDown={(event) => {
                  if (!item.onClick) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    item.onClick();
                  }
                }}
                role={item.onClick ? "button" : undefined}
                tabIndex={item.onClick ? 0 : undefined}
                className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${
                  item.onClick
                    ? "cursor-pointer transition-colors hover:border-[#127fec]/50"
                    : ""
                }`}
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
                {item.helper && (
                  <p className="text-xs font-semibold text-[#127fec] mt-3">
                    {item.helper}
                  </p>
                )}
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
    <button
      onClick={() => navigate("/doctor/doc-appointments?scope=today")}
      className="text-[#127fec] text-sm font-medium hover:underline"
    >
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

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl p-6 bg-white border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-semibold text-slate-800">Admit Room Information</p>
              <BedDouble size={20} className="text-[#127fec]" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Active</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? "..." : roomAdmissionStats.activeRoomAdmissions}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Total</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? "..." : roomAdmissionStats.totalRoomAdmissions}
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading room admission details...</p>
            ) : doctorRoomAdmissions.length === 0 ? (
              <p className="text-sm text-slate-500">No room admissions assigned to you.</p>
            ) : (
              <div className="space-y-3">
                {doctorRoomAdmissions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/doctor/room-admissions/${item.id}`)}
                    className="w-full text-left rounded-xl border border-slate-100 p-3 bg-slate-50 transition hover:border-[#127fec]/40 hover:bg-white"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        Room {item.roomNumber} · {item.patientName}
                      </p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${toRoomStatusClass(item.status)}`}>
                        {toStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Admitted: {formatDateTime(item.admittedAt)}
                    </p>
                    <p className="text-xs font-semibold text-[#127fec] mt-2">View full details</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}