import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, AlarmClock, MapPin, Loader2, Video, X } from "lucide-react";
import appointmentService from "../../api/appointmentService";

const STATUS_STYLES = {
    pending:   "bg-amber-50 text-amber-600 border border-amber-100",
    confirmed: "bg-blue-50 text-blue-600 border border-blue-100",
    completed: "bg-green-50 text-green-600 border border-green-100",
    cancelled: "bg-red-50 text-red-400 border border-red-100",
};

function AppointmentCard({ appt, onCancel, cancelling }) {
    const statusCls = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
    const accentColor =
        appt.status === "pending"    ? "linear-gradient(180deg, #f59e0b, #fbbf24)" :
        appt.status === "confirmed"  ? "linear-gradient(180deg, #0a5bbf, #127fec)" :
        appt.status === "completed"  ? "linear-gradient(180deg, #16a34a, #22c55e)" :
                                       "linear-gradient(180deg, #f87171, #ef4444)";

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
    });

    const formatTime = (timeStr) => {
        if (!timeStr) return "—";
        const [h, m] = timeStr.split(":");
        const hour = parseInt(h);
        return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-white/90 rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
            <div className="flex">
                <div className="w-1 flex-shrink-0" style={{ background: accentColor }} />
                <div className="flex-1 p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide capitalize ${statusCls}`}>
                            {appt.status}
                        </span>
                        <span className="text-slate-400 text-xs capitalize">
                            {appt.type === "in_person" ? "In-Person" : "Online"}
                        </span>
                    </div>

                    <p className="text-xl font-bold text-slate-800">{appt.doctor_name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{appt.specialization}</p>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <CalendarDays size={13} className="text-[#127fec]" />
                            {formatDate(appt.appointment_date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <AlarmClock size={13} className="text-[#127fec]" />
                            {formatTime(appt.appointment_time)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            {appt.type === "online"
                                ? <><Video size={13} className="text-[#127fec]" /> Online Consultation</>
                                : <><MapPin size={13} className="text-[#127fec]" /> In-Person Visit</>
                            }
                        </span>
                    </div>

                    {appt.symptoms && (
                        <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                            <span className="font-semibold text-slate-600">Symptoms: </span>
                            {appt.symptoms}
                        </p>
                    )}

                    {["pending", "confirmed"].includes(appt.status) && (
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => onCancel(appt.id)}
                                disabled={cancelling === appt.id}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors focus:outline-none disabled:opacity-50"
                            >
                                {cancelling === appt.id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <X size={13} />
                                }
                                Cancel
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default function PatientAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState("");
    const [cancelling, setCancelling]     = useState(null);
    const [filter, setFilter]             = useState("all");

    useEffect(() => {
        appointmentService.getPatientAppointments()
            .then(setAppointments)
            .catch(() => setError("Failed to load appointments."))
            .finally(() => setLoading(false));
    }, []);

    const handleCancel = async (id) => {
        setCancelling(id);
        try {
            await appointmentService.cancelAppointment(id);
            setAppointments(prev =>
                prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a)
            );
        } catch {
            setError("Failed to cancel appointment.");
        } finally {
            setCancelling(null);
        }
    };

    const filtered = filter === "all"
        ? appointments
        : appointments.filter(a => a.status === filter);

    return (
        <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-slate-800">My Appointments</h1>
                    <p className="text-slate-500 text-sm mt-1">Track and manage your scheduled visits.</p>
                </motion.div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {["all", "pending", "confirmed", "completed", "cancelled"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                                filter === f
                                    ? "bg-[#127fec] text-white border-[#127fec] shadow-md"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-[#127fec] hover:text-[#127fec]"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-sm">Loading appointments...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400 text-sm">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400 text-sm">
                        No {filter === "all" ? "" : filter} appointments found.
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <AnimatePresence>
                            {filtered.map(appt => (
                                <AppointmentCard
                                    key={appt.id}
                                    appt={appt}
                                    onCancel={handleCancel}
                                    cancelling={cancelling}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
