import { motion } from "framer-motion";
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

// Today's Date
const TODAY = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
});

const STATUS_STYLES = {
    Scheduled: "bg-blue-50 text-blue-600 border border-blue-100",
    Pending: "bg-amber-50 text-amber-600 border border-amber-100",
};

const APPOINTMENTS = [
    {
        id: 1,
        doctor: "Dr. Elena Rossi",
        specialty: "Cardiology Specialist",
        date: "Mar 15, 2025",
        time: "10:00 AM",
        location: "Room 304, West Wing",
        status: "Scheduled",
        type: "In-Person",
    },
    {
        id: 2,
        doctor: "Dr. James Patel",
        specialty: "General Physician",
        date: "Mar 22, 2025",
        time: "2:30 PM",
        location: "Online Consultation",
        status: "Pending",
        type: "Virtual",
    },
];

const HISTORY = [
    {
        id: 1,
        icon: Stethoscope,
        doctor: "Dr. Michael Chen",
        specialty: "Pediatrician",
        type: "Check-up",
        date: "Feb 12, 2025",
        action: "View Summary",
    },
    {
        id: 2,
        icon: HeartPulse,
        doctor: "Dr. Sarah Kim",
        specialty: "Cardiologist",
        type: "Follow-up",
        date: "Jan 10, 2025",
        action: "View Summary",
    },
];

function ActionCard({ icon: Icon, title, description, label, onClick, isAI }) {
    return (
        <motion.div
            whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={`flex flex-col gap-3 rounded-3xl p-6 shadow-sm border cursor-pointer select-none relative overflow-hidden bg-white/90 border-slate-100`}
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
                className={`mt-auto self-start flex items-center gap-1 py-1 px-3 text-xs font-semibold border rounded-full transition-colors text-blue-700 border-blue-500 hover:bg-blue-500 hover:text-white hover:border-transparent bg-transparent`}
            >
                {label} <ChevronRight size={13} />
            </button>
        </motion.div>
    );
}
function AppointmentCard({ appt }) {
    const statusCls = STATUS_STYLES[appt.status] || STATUS_STYLES.Scheduled;
    const accentColor =
        appt.status === "Pending"
            ? "linear-gradient(180deg, #f59e0b, #fbbf24)"
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
                            {appt.status}
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
                            Welcome back, James
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
                        {APPOINTMENTS.map((appt) => (
                            <AppointmentCard key={appt.id} appt={appt} />
                        ))}
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
                        {HISTORY.map((item) => (
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
                        ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
