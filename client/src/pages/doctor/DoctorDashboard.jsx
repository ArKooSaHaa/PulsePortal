import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Plus, TrendingUp, Loader2 } from "lucide-react";
import appointmentService from "../../api/appointmentService";

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
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    appointmentService
      .getDoctorAppointments()
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdating(id);
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch {}
    finally {
      setUpdating(null);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.appointment_date === todayStr);

  return (
    <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Good Morning, Dr. Smith</h1>
          <p className="text-slate-500 mt-1">
            You have <span className="text-[#0a5bbf] font-semibold">{loading ? "—" : todayAppts.length} appointments</span> scheduled for today.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold shadow-md"
          style={{
            background: "linear-gradient(135deg, #127fec, #0a5bbf)",
          }}
        >
          <Plus size={18} />
          New Appointment
        </motion.button>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Appointments Today", value: loading ? "—" : todayAppts.length, icon: <Calendar size={22} /> },
              { title: "Upcoming", value: loading ? "—" : appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed").length, icon: <Users size={22} /> },
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
                  <div className="p-3 bg-[#127fec]/10 text-[#0a5bbf] rounded-xl">{item.icon}</div>
                </div>
                <p className="text-slate-500 text-sm">{item.title}</p>
                <h2 className="text-3xl font-bold text-slate-800 mt-1">{item.value}</h2>
              </motion.div>
            ))}
          </div>

          {/* Schedule Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Today’s Schedule</h2>
              <button className="text-[#127fec] text-sm font-medium hover:underline">View Calendar</button>
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
                <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading schedule...</span>
                </div>
              ) : todayAppts.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">No appointments today.</div>
              ) : (
                todayAppts.map((item) => {
                  const formatTime = (t) => {
                    if (!t) return "—";
                    const [h, m] = t.split(":");
                    const hour = parseInt(h);
                    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
                  };

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ backgroundColor: "#f8fafc" }}
                      className="grid grid-cols-4 items-center p-4 rounded-xl border border-slate-100 transition"
                    >
                      <div className="font-medium text-slate-700">{formatTime(item.appointment_time)}</div>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
                          {item.patient_name?.charAt(0)}
                        </div>
                        <span className="text-slate-600 font-medium">{item.patient_name}</span>
                      </div>
                      <div className="text-slate-500 text-sm capitalize">{item.type === "in_person" ? "In-Person" : "Online"}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                            item.status === "confirmed"
                              ? "bg-blue-100 text-blue-600"
                              : item.status === "completed"
                                ? "bg-green-100 text-green-600"
                                : item.status === "cancelled"
                                  ? "bg-red-100 text-red-400"
                                  : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.status === "pending" && (
                          <button
                            onClick={() => handleStatusUpdate(item.id, "confirmed")}
                            disabled={updating === item.id}
                            className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition disabled:opacity-50"
                          >
                            {updating === item.id ? "..." : "Confirm"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
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
            <h2 className="text-4xl font-bold">94%</h2>
            <p className="text-sm opacity-90 mt-2">You are in the top 5% of efficiency this week.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
