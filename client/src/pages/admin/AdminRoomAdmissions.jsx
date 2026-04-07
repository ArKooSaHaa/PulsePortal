import { useEffect, useMemo, useState } from "react";
import {
    BedDouble,
    Building2,
    CalendarDays,
    Clock3,
    ClipboardPlus,
    DoorOpen,
    Stethoscope,
    UserRound,
} from "lucide-react";
import adminRoomAdmissionService from "../../api/adminRoomAdmissionService";

const STATUS_OPTIONS = ["admitted", "discharged"];

const defaultStats = {
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    activeAdmissions: 0,
    dischargedAdmissions: 0,
    totalAdmissions: 0,
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

const toApiDateTime = (value) => {
    if (!value) {
        return "";
    }

    if (value.length === 16) {
        return `${value.replace("T", " ")}:00`;
    }

    return value.replace("T", " ");
};

const toStatusClass = (value) => {
    const status = String(value || "admitted").toLowerCase();

    if (status === "discharged") {
        return "bg-blue-100 text-blue-700 border-blue-200";
    }

    return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const toTitleCase = (value) =>
    String(value || "")
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

export default function AdminRoomAdmissions() {
    const [stats, setStats] = useState(defaultStats);
    const [recentAdmissions, setRecentAdmissions] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [lookups, setLookups] = useState({
        patients: [],
        doctors: [],
        availableRooms: [],
    });

    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingAdmissions, setLoadingAdmissions] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dischargingId, setDischargingId] = useState(null);

    const [statusFilter, setStatusFilter] = useState("all");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [patientSearch, setPatientSearch] = useState("");
    const [doctorSearch, setDoctorSearch] = useState("");

    const [form, setForm] = useState({
        patientId: "",
        roomId: "",
        doctorId: "",
        admissionReason: "",
        admissionNotes: "",
        expectedDischargeAt: "",
    });

    const summaryCards = useMemo(
        () => [
            {
                key: "totalRooms",
                label: "Total Rooms",
                value: stats.totalRooms,
                Icon: Building2,
                color: "text-slate-700",
            },
            {
                key: "availableRooms",
                label: "Available Rooms",
                value: stats.availableRooms,
                Icon: DoorOpen,
                color: "text-emerald-600",
            },
            {
                key: "occupiedRooms",
                label: "Occupied Rooms",
                value: stats.occupiedRooms,
                Icon: BedDouble,
                color: "text-amber-600",
            },
            {
                key: "activeAdmissions",
                label: "Active Admissions",
                value: stats.activeAdmissions,
                Icon: ClipboardPlus,
                color: "text-[#127fec]",
            },
            {
                key: "dischargedAdmissions",
                label: "Discharged",
                value: stats.dischargedAdmissions,
                Icon: CalendarDays,
                color: "text-indigo-600",
            },
            {
                key: "totalAdmissions",
                label: "Total Admissions",
                value: stats.totalAdmissions,
                Icon: Clock3,
                color: "text-slate-600",
            },
        ],
        [stats],
    );

    const filteredPatients = useMemo(() => {
        const term = patientSearch.trim().toLowerCase();

        const baseResults = term
            ? lookups.patients.filter((patient) => {
                  const haystack = `${patient.name} ${patient.email}`.toLowerCase();
                  return haystack.includes(term);
              })
            : lookups.patients;

        if (!form.patientId) {
            return baseResults;
        }

        const selected = lookups.patients.find(
            (patient) => String(patient.id) === String(form.patientId),
        );

        if (!selected) {
            return baseResults;
        }

        const alreadyIncluded = baseResults.some(
            (patient) => patient.id === selected.id,
        );

        return alreadyIncluded ? baseResults : [selected, ...baseResults];
    }, [lookups.patients, patientSearch, form.patientId]);

    const filteredDoctors = useMemo(() => {
        const term = doctorSearch.trim().toLowerCase();

        const baseResults = term
            ? lookups.doctors.filter((doctor) => {
                  const haystack = `${doctor.name} ${doctor.department} ${doctor.specialization}`.toLowerCase();
                  return haystack.includes(term);
              })
            : lookups.doctors;

        if (!form.doctorId) {
            return baseResults;
        }

        const selected = lookups.doctors.find(
            (doctor) => String(doctor.id) === String(form.doctorId),
        );

        if (!selected) {
            return baseResults;
        }

        const alreadyIncluded = baseResults.some(
            (doctor) => doctor.id === selected.id,
        );

        return alreadyIncluded ? baseResults : [selected, ...baseResults];
    }, [lookups.doctors, doctorSearch, form.doctorId]);

    const loadSummaryAndLookups = async () => {
        setLoadingSummary(true);

        try {
            const [summary, lookupData] = await Promise.all([
                adminRoomAdmissionService.getDashboardSummary({ limit: 5 }),
                adminRoomAdmissionService.getLookupData(),
            ]);

            setStats(summary.stats);
            setRecentAdmissions(summary.recentAdmissions);
            setLookups(lookupData);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to load room admission data right now.",
            );
            setStats(defaultStats);
            setRecentAdmissions([]);
            setLookups({ patients: [], doctors: [], availableRooms: [] });
        } finally {
            setLoadingSummary(false);
        }
    };

    const loadAdmissions = async (filter = "all") => {
        setLoadingAdmissions(true);

        try {
            const rows = await adminRoomAdmissionService.getAdmissions({
                status: filter === "all" ? "" : filter,
            });
            setAdmissions(rows);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to load room admissions right now.",
            );
            setAdmissions([]);
        } finally {
            setLoadingAdmissions(false);
        }
    };

    useEffect(() => {
        loadSummaryAndLookups();
    }, []);

    useEffect(() => {
        loadAdmissions(statusFilter);
    }, [statusFilter]);

    const refreshAll = async () => {
        await Promise.all([
            loadSummaryAndLookups(),
            loadAdmissions(statusFilter),
        ]);
    };

    const handleCreateAdmission = async (event) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setError("");
        setSuccess("");

        if (!form.patientId || !form.roomId) {
            setError("Patient and room are required.");
            return;
        }

        setSubmitting(true);

        try {
            await adminRoomAdmissionService.createAdmission({
                patientId: Number(form.patientId),
                roomId: Number(form.roomId),
                doctorId: form.doctorId ? Number(form.doctorId) : null,
                admissionReason: form.admissionReason.trim(),
                admissionNotes: form.admissionNotes.trim(),
                expectedDischargeAt: toApiDateTime(form.expectedDischargeAt),
            });

            setForm({
                patientId: "",
                roomId: "",
                doctorId: "",
                admissionReason: "",
                admissionNotes: "",
                expectedDischargeAt: "",
            });
            setPatientSearch("");
            setDoctorSearch("");

            setSuccess("Patient admitted successfully.");
            await refreshAll();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not create room admission right now.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDischarge = async (admissionId) => {
        if (dischargingId === admissionId) {
            return;
        }

        const dischargeNotes = window.prompt(
            "Optional discharge notes:",
            "",
        );

        if (dischargeNotes === null) {
            return;
        }

        setDischargingId(admissionId);
        setError("");
        setSuccess("");

        try {
            await adminRoomAdmissionService.dischargeAdmission({
                admissionId,
                dischargeNotes: dischargeNotes.trim(),
            });

            setSuccess("Patient discharged successfully.");
            await refreshAll();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not discharge this admission right now.",
            );
        } finally {
            setDischargingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">Admit Room</h1>
                    <p className="text-slate-500 mt-1">
                        Manage patient room admissions, occupancy, and discharge workflows from the database.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-100 bg-white p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded-xl border border-emerald-100 bg-white p-4 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
                    {summaryCards.map(({ key, label, value, Icon, color }) => (
                        <div
                            key={key}
                            className="rounded-2xl border border-slate-100 bg-white p-4"
                        >
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                                <Icon size={18} className={color} />
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                {label}
                            </p>
                            <p className="text-xl font-bold text-slate-800">
                                {loadingSummary ? "..." : Number(value || 0).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
                    <form
                        onSubmit={handleCreateAdmission}
                        className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-5"
                    >
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            New Room Admission
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                                    Patient
                                </label>
                                <input
                                    type="text"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    placeholder="Search patient by name or email"
                                    className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                />
                                <select
                                    value={form.patientId}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            patientId: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                    required
                                >
                                    <option value="">Select patient</option>
                                    {filteredPatients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.name} ({patient.email})
                                        </option>
                                    ))}
                                </select>
                                {filteredPatients.length === 0 && (
                                    <p className="mt-1 text-xs text-slate-400">
                                        No patients match this search.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                                    Room
                                </label>
                                <select
                                    value={form.roomId}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            roomId: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                    required
                                >
                                    <option value="">Select available room</option>
                                    {lookups.availableRooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            Room {room.roomNumber} · {room.roomType} · Floor {room.floorNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                                    Assigned Doctor (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={doctorSearch}
                                    onChange={(e) => setDoctorSearch(e.target.value)}
                                    placeholder="Search doctor by name or department"
                                    className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                />
                                <select
                                    value={form.doctorId}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            doctorId: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                >
                                    <option value="">Not assigned</option>
                                    {filteredDoctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.name}
                                            {doctor.department ? ` · ${doctor.department}` : ""}
                                        </option>
                                    ))}
                                </select>
                                {filteredDoctors.length === 0 && (
                                    <p className="mt-1 text-xs text-slate-400">
                                        No doctors match this search.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                                    Expected Discharge (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.expectedDischargeAt}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            expectedDischargeAt: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                                    Admission Reason
                                </label>
                                <input
                                    type="text"
                                    value={form.admissionReason}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            admissionReason: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g. Post-surgery observation"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                                    Admission Notes
                                </label>
                                <input
                                    type="text"
                                    value={form.admissionNotes}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            admissionNotes: e.target.value,
                                        }))
                                    }
                                    placeholder="Additional details"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#127fec]"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || lookups.availableRooms.length === 0}
                            className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            style={{
                                background: "linear-gradient(135deg, #0a5bbf, #127fec)",
                            }}
                        >
                            {submitting ? "Admitting..." : "Admit Patient"}
                        </button>
                    </form>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Recent Admissions
                        </h2>

                        <div className="space-y-3">
                            {loadingSummary ? (
                                <p className="text-sm text-slate-500">Loading recent admissions...</p>
                            ) : recentAdmissions.length === 0 ? (
                                <p className="text-sm text-slate-500">No recent admissions yet.</p>
                            ) : (
                                recentAdmissions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <p className="text-sm font-semibold text-slate-800">
                                            Room {item.roomNumber} · {item.patientName}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {formatDateTime(item.admittedAt)}
                                        </p>
                                        <span
                                            className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toStatusClass(
                                                item.status,
                                            )}`}
                                        >
                                            {toTitleCase(item.status)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Room Admission Records
                        </h2>

                        <div className="flex flex-wrap gap-2">
                            {["all", ...STATUS_OPTIONS].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                                        statusFilter === status
                                            ? "border-[#127fec] text-[#127fec] bg-[#127fec]/10"
                                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                                    }`}
                                >
                                    {status === "all" ? "All" : toTitleCase(status)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingAdmissions ? (
                        <p className="text-sm text-slate-500">Loading room admissions...</p>
                    ) : admissions.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No room admissions found for this filter.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {admissions.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-slate-100 p-4"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Patient
                                            </p>
                                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                                <UserRound size={14} className="text-[#127fec]" />
                                                {item.patientName}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">{item.patientEmail || "No email"}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Room
                                            </p>
                                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                                <BedDouble size={14} className="text-[#127fec]" />
                                                {item.roomNumber} · {item.roomType}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Floor {item.floorNumber || "-"}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Doctor
                                            </p>
                                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                                <Stethoscope size={14} className="text-[#127fec]" />
                                                {item.doctorName || "Not assigned"}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">{item.doctorDepartment || ""}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Status
                                            </p>
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toStatusClass(
                                                    item.status,
                                                )}`}
                                            >
                                                {toTitleCase(item.status)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Admitted At
                                            </p>
                                            <p className="text-sm text-slate-700">{formatDateTime(item.admittedAt)}</p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Expected Discharge
                                            </p>
                                            <p className="text-sm text-slate-700">
                                                {formatDateTime(item.expectedDischargeAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                Discharged At
                                            </p>
                                            <p className="text-sm text-slate-700">{formatDateTime(item.dischargedAt)}</p>
                                        </div>
                                    </div>

                                    {(item.admissionReason || item.admissionNotes || item.dischargeNotes) && (
                                        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                                            {item.admissionReason ? (
                                                <p>
                                                    <span className="font-semibold text-slate-700">Reason:</span>{" "}
                                                    {item.admissionReason}
                                                </p>
                                            ) : null}
                                            {item.admissionNotes ? (
                                                <p className="mt-1">
                                                    <span className="font-semibold text-slate-700">Admission Notes:</span>{" "}
                                                    {item.admissionNotes}
                                                </p>
                                            ) : null}
                                            {item.dischargeNotes ? (
                                                <p className="mt-1">
                                                    <span className="font-semibold text-slate-700">Discharge Notes:</span>{" "}
                                                    {item.dischargeNotes}
                                                </p>
                                            ) : null}
                                        </div>
                                    )}

                                    {String(item.status).toLowerCase() === "admitted" && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => handleDischarge(item.id)}
                                                disabled={dischargingId === item.id}
                                                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                                            >
                                                {dischargingId === item.id ? "Discharging..." : "Discharge Patient"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
