import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Mail, Stethoscope, UserRound } from "lucide-react";
import adminAppointmentService from "../../api/adminAppointmentService";

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

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

    if (key === "completed") {
        return "text-blue-700 bg-blue-50 border-blue-200";
    }

    if (key === "cancelled") {
        return "text-rose-700 bg-rose-50 border-rose-200";
    }

    return "text-amber-700 bg-amber-50 border-amber-200";
};

const toTitleCase = (status) =>
    String(status || "")
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

export default function AdminAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    const loadAppointments = async (filter = "all") => {
        setLoading(true);
        setError("");

        try {
            const rows = await adminAppointmentService.getAppointments({
                status: filter === "all" ? "" : filter,
            });
            setAppointments(rows);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to load admin appointments right now.",
            );
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments(statusFilter);
    }, [statusFilter]);

    const stats = useMemo(() => {
        const totals = {
            total: appointments.length,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
        };

        for (const appointment of appointments) {
            const key = String(appointment.status || "pending").toLowerCase();
            if (Object.prototype.hasOwnProperty.call(totals, key)) {
                totals[key] += 1;
            }
        }

        return totals;
    }, [appointments]);

    const handleStatusUpdate = async (appointmentId, nextStatus) => {
        if (!nextStatus || updatingId === appointmentId) {
            return;
        }

        setUpdatingId(appointmentId);
        setError("");

        try {
            const updated = await adminAppointmentService.updateAppointmentStatus({
                appointmentId,
                status: nextStatus,
            });

            setAppointments((current) =>
                current.map((item) => (item.id === appointmentId ? updated : item)),
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not update appointment status right now.",
            );
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="p-5 sm:p-8 min-h-screen bg-[#eff6ff]">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
                    All Appointments
                </h1>
                <p className="text-slate-500 mb-6">
                    Manage hospital-wide appointments from the database.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    {[
                        { key: "total", label: "Total" },
                        { key: "pending", label: "Pending" },
                        { key: "confirmed", label: "Confirmed" },
                        { key: "completed", label: "Completed" },
                        { key: "cancelled", label: "Cancelled" },
                    ].map((item) => (
                        <div
                            key={item.key}
                            className="bg-white rounded-2xl border border-slate-100 p-4"
                        >
                            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
                                {item.label}
                            </p>
                            <p className="text-2xl font-bold text-slate-800">
                                {stats[item.key]}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 mb-4 flex flex-wrap gap-2">
                    {["all", ...STATUS_OPTIONS].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                statusFilter === status
                                    ? "border-[#127fec] text-[#127fec] bg-[#127fec]/10"
                                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                        >
                            {status === "all" ? "All Statuses" : toTitleCase(status)}
                        </button>
                    ))}
                </div>

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
                        No appointments found for this status.
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                                <UserRound size={16} className="text-[#127fec]" />
                                                {appointment.patientName}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                                <Mail size={14} className="text-[#127fec]" />
                                                {appointment.patientEmail || "No email"}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 text-slate-800 font-semibold">
                                                <Stethoscope size={16} className="text-[#127fec]" />
                                                {appointment.doctorName}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {appointment.doctorSpecialization || "General Physician"}
                                                {appointment.doctorDepartment
                                                    ? ` · ${appointment.doctorDepartment}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
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

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Status
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusClass(
                                                        appointment.status,
                                                    )}`}
                                                >
                                                    {String(appointment.status || "pending").toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                            Update Status
                                        </p>
                                        <select
                                            value={String(appointment.status || "pending").toLowerCase()}
                                            onChange={(e) =>
                                                handleStatusUpdate(
                                                    appointment.id,
                                                    e.target.value,
                                                )
                                            }
                                            disabled={updatingId === appointment.id}
                                            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec] disabled:opacity-60"
                                        >
                                            {STATUS_OPTIONS.map((option) => (
                                                <option key={option} value={option}>
                                                    {toTitleCase(option)}
                                                </option>
                                            ))}
                                        </select>
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