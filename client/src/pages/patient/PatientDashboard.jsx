import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarPlus,
    CalendarCheck,
    Bot,
    MapPin,
    ChevronRight,
    Stethoscope,
    HeartPulse,
    CalendarDays,
    AlarmClock,
    Sparkles,
} from "lucide-react";
import AIChatPanel from "../../components/AIChatPanel";
import authService from "../../api/authService";
import patientAppointmentService from "../../api/patientAppointmentService";

// Today's Date
const TODAY = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
});

const STATUS_STYLES = {
    confirmed: "bg-blue-50 text-blue-600 border border-blue-100",
    pending: "bg-amber-50 text-amber-600 border border-amber-100",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    cancelled: "bg-rose-50 text-rose-600 border border-rose-100",
};

function ActionCard({ icon: Icon, title, description, label, onClick, isAI }) {
    return (
        <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={`flex flex-col gap-3 p-6 cursor-pointer select-none relative overflow-hidden bg-white/90
                        ${isAI ? "ai-border-glow" : "rounded-3xl shadow-sm border border-slate-100"}`}
        >
            {isAI && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#127fec] text-[10px] font-bold uppercase tracking-wide">
                    <Sparkles size={9} />
                    AI Powered
                </span>
            )}
            <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-[#127fec]`}
            >
                <Icon size={22} />
            </div>
            <div>
                <p className="text-[15px] font-semibold text-slate-800">
                    {title}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {description}
                </p>
            </div>
            <button
                className={`mt-auto self-start flex items-center gap-1 py-1 px-3 text-xs font-semibold border rounded-full transition-colors text-[#127fec] border-[#127fec] hover:bg-[#127fec] hover:text-white hover:border-transparent bg-transparent`}
            >
                {label} <ChevronRight size={13} />
            </button>
        </motion.div>
    );
}

function toStatusLabel(status) {
    const key = String(status || "pending").toLowerCase();

    if (key === "confirmed") {
        return "Scheduled";
    }

    return key.charAt(0).toUpperCase() + key.slice(1);
}

function toTypeLabel(type) {
    return String(type || "in-person").toLowerCase() === "online"
        ? "Virtual"
        : "In-Person";
}

function toLocationLabel(appointment) {
    if (String(appointment.appointmentType).toLowerCase() === "online") {
        return "Online Consultation";
    }

    return appointment.doctorDepartment
        ? `${appointment.doctorDepartment} Department`
        : "Hospital Visit";
}

function formatDateLabel(value) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return "Invalid date";
    }

    return parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTimeLabel(value) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return "Invalid time";
    }

    return parsed.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getHistoryIcon(specialization = "") {
    const key = String(specialization).toLowerCase();

    if (key.includes("card") || key.includes("heart")) {
        return HeartPulse;
    }

    return Stethoscope;
}

function AppointmentCard({ appt }) {
    const statusKey = String(appt.status || "pending").toLowerCase();
    const statusCls = STATUS_STYLES[statusKey] || STATUS_STYLES.confirmed;
    const accentColor =
        statusKey === "pending"
            ? "linear-gradient(180deg, #f59e0b, #fbbf24)"
            : statusKey === "cancelled"
              ? "linear-gradient(180deg, #9ca3af, #cbd5e1)"
            : "linear-gradient(180deg, #0a5bbf, #127fec)";

    return (
        <div className="bg-white/90 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex">
                <div
                    className="w-1 flex-shrink-0"
                    style={{ background: accentColor }}
                />
                <div className="flex-1 p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${statusCls}`}
                        >
                            {appt.statusLabel}
                        </span>
                        <span className="text-slate-400 text-xs">
                            {appt.type}
                        </span>
                    </div>

                    <p className="text-xl font-bold text-slate-800">
                        {appt.doctor}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {appt.specialty}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <CalendarDays
                                size={13}
                                className="text-[#127fec]"
                            />
                            {appt.date}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <AlarmClock size={13} className="text-[#127fec]" />
                            {appt.time}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <MapPin size={13} className="text-[#127fec]" />
                            {appt.location}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 pt-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="px-4 py-1 rounded-full text-sm font-semibold text-white shadow-sm focus:outline-none"
                            style={{
                                background:
                                    "linear-gradient(135deg, #0a5bbf, #127fec)",
                            }}
                        >
                            View Details
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-1.5 px-4 py-1 rounded-full text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors focus:outline-none"
                        >
                            Cancel
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PatientDashboard() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loadingUpcoming, setLoadingUpcoming] = useState(true);
    const [upcomingError, setUpcomingError] = useState("");
    const [historyRows, setHistoryRows] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [historyError, setHistoryError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadUpcoming = async () => {
            setLoadingUpcoming(true);
            setUpcomingError("");

            try {
                const upcomingRows = await patientAppointmentService.getUpcomingAppointments({
                    limit: 5,
                });

                const upcoming = upcomingRows
                    .map((item) => {
                        return {
                            id: item.id,
                            doctor: item.doctorName,
                            specialty:
                                item.doctorSpecialization || "General Physician",
                            date: formatDateLabel(item.appointmentDate),
                            time: formatTimeLabel(item.appointmentDate),
                            location: toLocationLabel(item),
                            status: item.status,
                            statusLabel: toStatusLabel(item.status),
                            type: toTypeLabel(item.appointmentType),
                        };
                    });

                if (!cancelled) {
                    setUpcomingAppointments(upcoming);
                }
            } catch (err) {
                if (!cancelled) {
                    setUpcomingAppointments([]);
                    setUpcomingError(
                        err.response?.data?.message ||
                            "Unable to load upcoming appointments right now.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingUpcoming(false);
                }
            }
        };

        loadUpcoming();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadHistory = async () => {
            setLoadingHistory(true);
            setHistoryError("");

            try {
                const rows = await patientAppointmentService.getRecentHistory({
                    limit: 5,
                });

                const mapped = rows.map((item) => {
                    const icon = getHistoryIcon(item.doctorSpecialization);

                    return {
                        id: item.id,
                        icon,
                        doctor: item.doctorName,
                        specialty:
                            item.doctorSpecialization || "General Physician",
                        type: toTypeLabel(item.appointmentType),
                        date: formatDateLabel(item.appointmentDate),
                        action: "View Summary",
                    };
                });

                if (!cancelled) {
                    setHistoryRows(mapped);
                }
            } catch (err) {
                if (!cancelled) {
                    setHistoryRows([]);
                    setHistoryError(
                        err.response?.data?.message ||
                            "Unable to load recent history right now.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingHistory(false);
                }
            }
        };

        loadHistory();

        return () => {
            cancelled = true;
        };
    }, []);

    const currentUser = authService.getCurrentUser();
    const displayName = currentUser?.name || "Patient";

    return (
        <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col sm:flex-row sm:items-end justify-between gap-2"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            Welcome back, {displayName}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            How are you feeling today?
                        </p>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-white/80 border border-slate-100 px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                        {TODAY}
                    </span>
                </motion.div>

                {/* Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                    <ActionCard
                        icon={CalendarPlus}
                        title="Book Appointment"
                        description="Schedule a new visit with a specialist."
                        label="Book Now"
                    />
                    <ActionCard
                        icon={CalendarCheck}
                        title="Upcoming Visits"
                        description="Check details of your next consultation."
                        label="View Visits"
                    />
                    <ActionCard
                        icon={Bot}
                        title="AI Health Assistant"
                        description="Describe symptoms and get guidance before booking."
                        label="Open Chat"
                        isAI
                        onClick={() => setIsChatOpen(true)}
                    />
                </motion.div>

                {/* Upcoming Appointments */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                >
                    <h2 className="text-lg font-bold text-slate-800 mb-3">
                        Upcoming Appointments
                    </h2>
                    <div className="flex flex-col gap-4">
                        {loadingUpcoming ? (
                            <div className="bg-white/90 rounded-2xl shadow-sm border border-slate-100 p-5 text-sm text-slate-500">
                                Loading upcoming appointments...
                            </div>
                        ) : upcomingError ? (
                            <div className="bg-white/90 rounded-2xl shadow-sm border border-red-100 p-5 text-sm text-red-500">
                                {upcomingError}
                            </div>
                        ) : upcomingAppointments.length === 0 ? (
                            <div className="bg-white/90 rounded-2xl shadow-sm border border-slate-100 p-5 text-sm text-slate-500">
                                No upcoming appointments found.
                            </div>
                        ) : (
                            upcomingAppointments.map((appt) => (
                                <AppointmentCard key={appt.id} appt={appt} />
                            ))
                        )}
                    </div>
                </motion.section>

                {/* Recent History */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.22 }}
                >
                    <h2 className="text-lg font-bold text-slate-800 mb-3">
                        Recent History
                    </h2>
                    <div className="flex flex-col gap-2">
                        {loadingHistory ? (
                            <div className="bg-white/90 rounded-2xl shadow-sm border border-slate-100 p-5 text-sm text-slate-500">
                                Loading recent history...
                            </div>
                        ) : historyError ? (
                            <div className="bg-white/90 rounded-2xl shadow-sm border border-red-100 p-5 text-sm text-red-500">
                                {historyError}
                            </div>
                        ) : historyRows.length === 0 ? (
                            <div className="bg-white/90 rounded-2xl shadow-sm border border-slate-100 p-5 text-sm text-slate-500">
                                No recent history found.
                            </div>
                        ) : (
                            historyRows.map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{
                                        backgroundColor: "rgba(255,255,255,1)",
                                        boxShadow:
                                            "0 4px 20px rgba(18,127,236,0.08)",
                                    }}
                                    className="flex items-center gap-4 bg-white/70 rounded-2xl px-5 py-4 my-1 border border-slate-100 transition-colors cursor-pointer"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <item.icon
                                            size={18}
                                            className="text-[#127fec]"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {item.doctor}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {item.specialty}&nbsp;·&nbsp;{item.type}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                                        <span className="text-xs text-slate-400 hidden sm:block">
                                            {item.date}
                                        </span>
                                        <button className="text-xs font-semibold text-[#127fec] hover:underline focus:outline-none whitespace-nowrap">
                                            {item.action}
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.section>

                <AnimatePresence>
                    {isChatOpen && (
                        <>
                            <motion.div
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsChatOpen(false)}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            />
                            <AIChatPanel
                                key="chat"
                                onClose={() => setIsChatOpen(false)}
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating  Chat Button */}
            <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setIsChatOpen(true)}
                className="ai-float-glow fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full flex items-center justify-center text-white focus:outline-none"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4)" }}
                title="Open AI Health Assistant"
            >
                <Bot size={24} />
            </motion.button>
        </div>
    );
}
