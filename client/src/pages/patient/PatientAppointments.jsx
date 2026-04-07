import { useEffect, useState } from "react";
import { CalendarDays, Clock3, UserRound } from "lucide-react";
import patientAppointmentService from "../../api/patientAppointmentService";

const formatDateTime = (value) => {
    if (!value) {
        return { date: "Not set", time: "Not set" };
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return { date: "Invalid date", time: "Invalid time" };
    }

    return {
        date: date.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
        }),
        time: date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        }),
    };
};

const getStatusClass = (status) => {
    const key = String(status || "").toLowerCase();

    if (key === "confirmed") {
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
    }

    if (key === "cancelled") {
        return "text-rose-700 bg-rose-50 border-rose-200";
    }

    return "text-amber-700 bg-amber-50 border-amber-200";
};

export default function PatientAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadAppointments = async () => {
            setLoading(true);
            setError("");

            try {
                const rows = await patientAppointmentService.getMyAppointments();

                if (!cancelled) {
                    setAppointments(rows);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            "Unable to load appointments right now.",
                    );
                    setAppointments([]);
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

    return (
        <div className="p-5 sm:p-8 min-h-screen bg-[#eff6ff]">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                    My Appointments
                </h1>
                <p className="text-slate-500 mb-6">
                    Track your upcoming and past bookings.
                </p>

                {loading && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
                        Loading appointments...
                    </div>
                )}

                {!loading && error && (
                    <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-500">
                        {error}
                    </div>
                )}

                {!loading && !error && appointments.length === 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
                        No appointments found yet.
                    </div>
                )}

                {!loading && !error && appointments.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {appointments.map((appointment) => {
                            const when = formatDateTime(appointment.appointmentDate);

                            return (
                                <div
                                    key={appointment.id}
                                    className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                                <UserRound size={16} className="text-[#127fec]" />
                                                {appointment.doctorName}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {appointment.doctorSpecialization || "General Physician"}
                                                {appointment.doctorDepartment
                                                    ? ` · ${appointment.doctorDepartment}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <span
                                            className={`text-xs font-semibold px-3 py-1 rounded-full border w-fit ${getStatusClass(
                                                appointment.status,
                                            )}`}
                                        >
                                            {String(appointment.status || "pending").toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Date
                                            </p>
                                            <p className="text-sm text-slate-700 flex items-center gap-1.5">
                                                <CalendarDays size={14} className="text-[#127fec]" />
                                                {when.date}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Time
                                            </p>
                                            <p className="text-sm text-slate-700 flex items-center gap-1.5">
                                                <Clock3 size={14} className="text-[#127fec]" />
                                                {when.time}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Type
                                            </p>
                                            <p className="text-sm text-slate-700 capitalize">
                                                {appointment.appointmentType || "in-person"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
