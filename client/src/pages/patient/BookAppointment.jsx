import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AIChatPanel from "../../components/AIChatPanel";
import { Star, CheckCircle2, ChevronLeft, ChevronRight, Bot, Sparkles, Search, CalendarDays, Clock, UserCheck, ArrowRight, Video, MapPin } from "lucide-react";
import patientAppointmentService from "../../api/patientAppointmentService";

const TIME_SLOTS = Array.from({ length: 24 }, (_, index) => {
    const hour24 = index;
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return {
        id: index + 1,
        time: `${String(hour12).padStart(2, "0")}:00 ${period}`,
        available: true,
    };
});

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function DoctorCard({ doctor, selected, onSelect }) {
    return (
        <motion.div
            layout
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => onSelect(doctor)}
            className={`relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border
                ${
                    selected
                        ? "border-[#127fec] shadow-lg shadow-blue-100/60 bg-white"
                        : "border-slate-100 bg-white/80 hover:border-slate-200 hover:bg-white"
                }`}
            style={
                selected
                    ? {
                          boxShadow: `0 0 0 2px #127fec40, 0 4px 20px rgba(18,127,236,0.12)`,
                      }
                    : {}
            }
        >
            {/* Avatar */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: doctor.color, color: doctor.accent }}
            >
                {doctor.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                    {doctor.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                    {doctor.specialty} · {doctor.clinic}
                </p>
                <div className="flex items-center gap-1 mt-1">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-slate-700">
                        {doctor.rating}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                        ${doctor.fee} fee
                    </span>
                </div>
            </div>

            {/* Select indicator */}
            <AnimatePresence>
                {selected ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                        }}
                    >
                        <CheckCircle2
                            size={20}
                            className="text-[#127fec] flex-shrink-0"
                        />
                    </motion.div>
                ) : (
                    <motion.button
                        key="select"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-semibold text-[#127fec] border border-[#127fec] px-3 py-1 rounded-full hover:bg-[#127fec] hover:text-white transition-colors flex-shrink-0"
                    >
                        Select
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
    const d = new Date(year, month, 1).getDay();
    return (d + 6) % 7;
}
const MONTH_NAMES = [
    "January","February","March","April","May","June", "July","August","September","October","November","December",
];

function MiniCalendar({ selectedDate, onSelect }) {
    const today = new Date();
    const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

    const daysInMonth = getDaysInMonth(view.year, view.month);
    const firstDay = getFirstDayOfWeek(view.year, view.month);

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const prevMonth = () =>
        setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 });
    const nextMonth = () =>
        setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 });

    const isPast = (d) => {
        const cell = new Date(view.year, view.month, d);
        cell.setHours(0, 0, 0, 0);
        const t = new Date(); t.setHours(0, 0, 0, 0);
        return cell < t;
    };

    const isSelected = (d) =>
        selectedDate &&
        selectedDate.year === view.year &&
        selectedDate.month === view.month &&
        selectedDate.day === d;

    const isToday = (d) =>
        today.getFullYear() === view.year &&
        today.getMonth() === view.month &&
        today.getDate() === d;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div
                    onClick={prevMonth}
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                    <ChevronLeft size={18} className="text-slate-500" />
                </div>
                <p className="text-md font-bold text-slate-800">
                    {MONTH_NAMES[view.month]} {view.year}
                </p>
                <div
                    onClick={nextMonth}
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                    <ChevronRight size={18} className="text-slate-500" />
                </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[13px] font-semibold text-slate-400 py-1">{d}</div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />;
                    const past = isPast(day);
                    const sel = isSelected(day);
                    const tod = isToday(day);

                    return (
                        <motion.button
                            key={day}
                            whileTap={!past ? { scale: 0.9 } : {}}
                            disabled={past}
                            onClick={() => !past && onSelect({ year: view.year, month: view.month, day })}
                            className={`w-8 h-8 mx-auto rounded-full text-sm font-medium transition-all flex items-center justify-center
                                ${past ? "text-slate-200 cursor-not-allowed" : "cursor-pointer hover:bg-blue-50 hover:text-[#127fec]"}
                                ${sel ? "!bg-[#127fec] !text-white shadow-md shadow-blue-200 font-bold" : ""}
                                ${tod && !sel ? "ring-1 ring-[#127fec] text-[#127fec] font-bold" : ""}
                                ${!past && !sel ? "text-slate-700" : ""}
                            `}
                        >
                            {day}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

function TimeSlotGrid({ selectedTime, onSelect }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => {
                    const isSel = selectedTime === slot.time;
                    return (
                        <motion.button
                            key={slot.id}
                            whileTap={slot.available ? { scale: 0.92 } : {}}
                            whileHover={slot.available && !isSel ? { scale: 1.03 } : {}}
                            disabled={!slot.available}
                            onClick={() => slot.available && onSelect(slot.time)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border
                                ${!slot.available
                                    ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed line-through"
                                    : isSel
                                        ? "border-[#127fec] text-white shadow-md shadow-blue-200"
                                        : "border-slate-200 text-slate-700 hover:border-[#127fec] hover:text-[#127fec] bg-white"
                                }`}
                            style={isSel ? { background: "linear-gradient(135deg, #0a5bbf, #127fec)" } : {}}
                        >
                            {slot.time}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
function SummaryRow({ label, value, icon: Icon, done }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            <div className="flex items-center gap-1.5">
                {Icon && <Icon size={13} className={done ? "text-[#127fec]" : "text-slate-300"} />}
                <AnimatePresence mode="wait">
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        className={`text-sm font-semibold ${done ? "text-slate-800" : "text-slate-300"}`}
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    );
}

function formatDate(year, month, day) {
    return `${day} ${MONTH_NAMES[month]} ${year}`;
}

function toAppointmentIso(selectedDate, selectedTime) {
    if (!selectedDate || !selectedTime) {
        return null;
    }

    const [clock, period] = selectedTime.split(" ");
    const [hourText, minuteText] = clock.split(":");

    let hours = Number(hourText);
    const minutes = Number(minuteText);

    if (period === "PM" && hours < 12) {
        hours += 12;
    }

    if (period === "AM" && hours === 12) {
        hours = 0;
    }

    const appointmentDate = new Date(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
        hours,
        minutes,
        0,
    );

    return appointmentDate.toISOString();
}


export default function BookAppointment() {
    const [search, setSearch] = useState("");
    const [dept, setDept] = useState("All");
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState(["All"]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [doctorsError, setDoctorsError] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [bookingError, setBookingError] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const timer = setTimeout(async () => {
            setLoadingDoctors(true);
            setDoctorsError("");

            try {
                const result = await patientAppointmentService.getDoctors({
                    search: search.trim(),
                    department: dept === "All" ? "" : dept,
                });

                if (cancelled) {
                    return;
                }

                setDoctors(result);

                if (!search.trim() && dept === "All") {
                    const uniqueDepartments = Array.from(
                        new Set(
                            result
                                .map((doctor) => doctor.department)
                                .filter(Boolean),
                        ),
                    );
                    setDepartments(["All", ...uniqueDepartments]);
                }
            } catch (err) {
                if (!cancelled) {
                    setDoctors([]);
                    setDoctorsError(
                        err.response?.data?.message ||
                            "Unable to load doctors right now.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingDoctors(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [search, dept]);

    const filteredDoctors = doctors;

    const canConfirm = selectedDoctor && selectedType && selectedDate && selectedTime;

    const handleConfirm = async () => {
        if (!canConfirm || isConfirming) {
            return;
        }

        setBookingError("");
        setIsConfirming(true);

        const appointmentIso = toAppointmentIso(selectedDate, selectedTime);

        try {
            await patientAppointmentService.createAppointment({
                doctorId: selectedDoctor.id,
                appointmentType: selectedType,
                appointmentDate: appointmentIso,
            });

            setConfirmed(true);
        } catch (err) {
            setBookingError(
                err.response?.data?.message ||
                    "Could not book the appointment. Please try again.",
            );
        } finally {
            setIsConfirming(false);
        }
    };

    const dateLabel = selectedDate
        ? formatDate(selectedDate.year, selectedDate.month, selectedDate.day)
        : "Not selected";

    // Booking confirmation overlay
    if (confirmed) {
        return (
            <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center px-4">
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-md w-full text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                        style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
                    >
                        <CheckCircle2 size={40} className="text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Booking Confirmed!</h2>
                    <p className="text-sm text-slate-500 mb-6">Your appointment has been scheduled.</p>

                    <div className="bg-blue-50 rounded-2xl p-5 text-left space-y-3 mb-7">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Doctor</p>
                            <p className="text-sm font-semibold text-slate-800">{selectedDoctor.name}</p>
                            <p className="text-xs text-slate-500">{selectedDoctor.specialty}</p>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</p>
                                <p className="text-sm font-semibold text-slate-800">{dateLabel}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</p>
                                <p className="text-sm font-semibold text-slate-800">{selectedTime}</p>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            setConfirmed(false);
                            setSelectedDoctor(null);
                            setSelectedType(null);
                            setSelectedDate(null);
                            setSelectedTime(null);
                            setBookingError("");
                        }}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg"
                        style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
                    >
                        Book Another Appointment
                    </motion.button>
                </motion.div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#eff6ff] px-3 sm:px-5 lg:px-8 py-5">
            <div className="max-w-6xl mx-auto">
                {/*  Header  */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 pt-6"
                >
                    <h1 className="text-3xl font-bold text-slate-800">Book Appointment</h1>
                    <p className="text-slate-500 text-md mt-1">
                        Find the best care and schedule your visit in seconds.
                    </p>
                </motion.div>

                {/*  Two-column layout  */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/*  LEFT panel  */}
                    <div className="flex-1 flex flex-col gap-5 min-w-0">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.05 }}
                            className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-sm py-6 px-8"
                        >
                            {/* Section header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="font-bold text-lg text-slate-800">Find a Doctor</h2>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setIsChatOpen(true)}
                                    className="ai-border-glow flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#127fec] bg-white rounded-2xl"
                                >
                                    <Sparkles size={12} />
                                    Suggest best doctor by symptoms
                                </motion.button>
                            </div>

                            {/* Search + Department filter */}
                            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name or specialization"
                                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#127fec] focus:ring-2 focus:ring-[#127fec]/20 transition-all"
                                    />
                                </div>
                                <select
                                    value={dept}
                                    onChange={(e) => setDept(e.target.value)}
                                    className="px-5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#127fec] transition-all text-slate-700 font-medium cursor-pointer"
                                >
                                    {departments.map((d) => (
                                        <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Doctor list */}
                            <div className="flex flex-col gap-2">
                                <AnimatePresence>
                                    {loadingDoctors ? (
                                        <motion.div
                                            key="loading-doctors"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-8 text-sm text-slate-400"
                                        >
                                            Loading doctors...
                                        </motion.div>
                                    ) : doctorsError ? (
                                        <motion.div
                                            key="doctors-error"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-8 text-sm text-red-500"
                                        >
                                            {doctorsError}
                                        </motion.div>
                                    ) : filteredDoctors.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-8 text-sm text-slate-400"
                                        >
                                            No doctors found.
                                        </motion.div>
                                    ) : (
                                        filteredDoctors.map((doc) => (
                                            <motion.div
                                                key={doc.id}
                                                layout
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.96 }}
                                            >
                                                <DoctorCard
                                                    doctor={doc}
                                                    selected={selectedDoctor?.id === doc.id}
                                                    onSelect={(d) => {
                                                        setSelectedDoctor(d);
                                                        setSelectedType(null);
                                                        setSelectedDate(null);
                                                        setSelectedTime(null);
                                                    }}
                                                />
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                        {/* Type selector */}
                        <AnimatePresence>
                            {selectedDoctor && (
                                <motion.div
                                    key="type"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="px-1 mb-2">
                                        <h2 className="text-base font-bold text-slate-800">Appointment Type</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: "online", label: "Online", sub: "Video consultation", Icon: Video },
                                            { id: "in-person", label: "In-Person", sub: "Visit the clinic", Icon: MapPin },
                                        ].map(({ id, label, sub, Icon }) => {
                                            const sel = selectedType === id;
                                            return (
                                                <motion.div
                                                    key={id}
                                                    whileHover={{ y: -2 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setSelectedType(id)}
                                                    className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer border transition-all ${
                                                        sel
                                                            ? "border-[#127fec] bg-white shadow-lg shadow-blue-100/60"
                                                            : "border-slate-100 bg-white/80 hover:border-slate-200 hover:bg-white"
                                                    }`}
                                                    style={sel ? { boxShadow: "0 0 0 2px #127fec30, 0 4px 16px rgba(18,127,236,0.10)" } : {}}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                                        sel ? "bg-[#127fec] text-white" : "bg-slate-100 text-slate-400"
                                                    }`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-bold truncate ${sel ? "text-[#127fec]" : "text-slate-700"}`}>{label}</p>
                                                        <p className="text-xs text-slate-400 truncate">{sub}</p>
                                                    </div>
                                                    <AnimatePresence>
                                                        {sel && (
                                                            <motion.div
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0, opacity: 0 }}
                                                                className="ml-auto flex-shrink-0"
                                                            >
                                                                <CheckCircle2 size={18} className="text-[#127fec]" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Calendar and Time grid */}
                        <AnimatePresence>
                            {selectedType && (
                                <motion.div
                                    key="datetime"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.35 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    {/* Calendar */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <h2 className="text-base font-bold text-slate-800">Select Date</h2>
                                        </div>
                                        <MiniCalendar selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }} />
                                    </div>

                                    {/* Time Slots */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <h2 className="text-base font-bold text-slate-800">Select Time</h2>
                                        </div>
                                        <TimeSlotGrid selectedTime={selectedTime} onSelect={setSelectedTime} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/*  RIGHT panel  */}
                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="w-full lg:w-80 xl:w-[330px] flex-shrink-0 sticky top-24"
                    >
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                            {/* Card header */}
                            <div className="flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50">
                                    <CalendarDays size={16} className="text-[#127fec]" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Appointment Summary</h3>
                            </div>

                            {/* Doctor summary with avatar */}
                            <div className="mb-5">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Doctor</span>
                                <AnimatePresence mode="wait">
                                    {selectedDoctor ? (
                                        <motion.div
                                            key={selectedDoctor.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.22 }}
                                            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                                style={{ background: `${selectedDoctor.accent}18`, color: selectedDoctor.accent }}
                                            >
                                                {selectedDoctor.avatar}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{selectedDoctor.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{selectedDoctor.specialty}</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty-doc"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <UserCheck size={16} className="text-slate-300" />
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium">Not selected</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="h-px bg-slate-100 mb-5" />

                            <div className="mb-4">
                                <SummaryRow
                                    label="Type"
                                    value={selectedType ? (selectedType === "online" ? "Online" : "In-Person") : "Not selected"}
                                    icon={selectedType === "online" ? Video : MapPin}
                                    done={!!selectedType}
                                />
                            </div>

                            {/* Date + Time rows */}
                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <SummaryRow
                                    label="Date"
                                    value={selectedDate ? dateLabel : "Not selected"}
                                    icon={CalendarDays}
                                    done={!!selectedDate}
                                />
                                <SummaryRow
                                    label="Time"
                                    value={selectedTime ?? "Not selected"}
                                    icon={Clock}
                                    done={!!selectedTime}
                                />
                            </div>

                            {/* Fee */}
                            <AnimatePresence>
                                {selectedDoctor && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center justify-between py-3 mb-4 border-t border-slate-100"
                                    >
                                        <span className="text-sm text-slate-500 font-medium">Consultation Fee</span>
                                        <span className="text-xl font-bold text-slate-800">
                                            ${selectedDoctor.fee}.00
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {bookingError && (
                                <p className="text-xs text-red-500 mb-3 text-center">
                                    {bookingError}
                                </p>
                            )}

                            {/* Confirm button */}
                            <motion.button
                                whileHover={canConfirm && !isConfirming ? { scale: 1.02 } : {}}
                                whileTap={canConfirm && !isConfirming ? { scale: 0.97 } : {}}
                                onClick={handleConfirm}
                                disabled={!canConfirm || isConfirming}
                                className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300
                                    ${canConfirm && !isConfirming
                                        ? "text-white shadow-lg shadow-blue-200 cursor-pointer"
                                        : "text-slate-400 bg-slate-100 cursor-not-allowed"
                                    }`}
                                style={canConfirm && !isConfirming ? { background: "linear-gradient(135deg, #0a5bbf, #127fec)" } : {}}
                            >
                                {isConfirming ? (
                                    "Booking..."
                                ) : canConfirm ? (
                                    <>Confirm Booking <ArrowRight size={16} /></>
                                ) : (
                                    "Complete all steps above"
                                )}
                            </motion.button>
                        </div>

                        {/* Progress tracker */}
                        <div className="mt-4 bg-white/80 rounded-2xl border border-slate-100 shadow-sm p-4">
                            <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Your Progress</p>
                            <div className="flex items-center gap-2">
                                {[
                                    { label: "Doctor", done: !!selectedDoctor },
                                    { label: "Type", done: !!selectedType },
                                    { label: "Date", done: !!selectedDate },
                                    { label: "Time", done: !!selectedTime },
                                ].map((step, i, arr) => (
                                    <div key={step.label} className="flex items-center gap-2 flex-1">
                                        <div className="flex flex-col items-center gap-1 flex-1">
                                            <motion.div
                                                animate={{
                                                    background: step.done
                                                        ? "linear-gradient(135deg, #0a5bbf, #127fec)"
                                                        : "#e2e8f0",
                                                    scale: step.done ? 1.1 : 1,
                                                }}
                                                transition={{ duration: 0.3 }}
                                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                            >
                                                {step.done ? (
                                                    <CheckCircle2 size={12} className="text-white" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
                                                )}
                                            </motion.div>
                                            <span className={`text-[10px] font-semibold ${step.done ? "text-[#127fec]" : "text-slate-400"}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {i < arr.length - 1 && (
                                            <motion.div
                                                animate={{ background: step.done ? "#127fec" : "#e2e8f0" }}
                                                transition={{ duration: 0.4 }}
                                                className="h-0.5 flex-1 rounded-full mb-3"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

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
                        <AIChatPanel key="chat" onClose={() => setIsChatOpen(false)} />
                    </>
                )}
            </AnimatePresence>

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
