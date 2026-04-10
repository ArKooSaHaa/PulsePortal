import { useEffect, useState } from "react";
import adminService from "../../api/adminService";
import { Loader2 } from "lucide-react";

const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-600",
    confirmed: "bg-blue-100 text-blue-600",
    completed: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
};

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function AdminAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const PER_PAGE = 8;

    useEffect(() => {
        adminService
            .getAllAppointments()
            .then((data) => setAppointments(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalPages = Math.ceil(appointments.length / PER_PAGE);

    const paginated = appointments.slice(
        (page - 1) * PER_PAGE,
        page * PER_PAGE
    );

    return (
        <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                    All Appointments
                </h1>
                <p className="text-gray-500 mt-2">
                    Complete list of all hospital appointments
                </p>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Loading appointments...</span>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                        No appointments found.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="text-left py-3 px-2">
                                            Patient
                                        </th>
                                        <th className="text-left py-3 px-2">
                                            Doctor
                                        </th>
                                        <th className="text-left py-3 px-2">
                                            Date
                                        </th>
                                        <th className="text-left py-3 px-2">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginated.map((a) => (
                                        <tr
                                            key={a.id}
                                            className="border-b last:border-none hover:bg-gray-50 transition"
                                        >
                                            <td className="py-4 px-2 font-medium text-gray-700">
                                                {a.patient_name}
                                            </td>

                                            <td className="py-4 px-2 text-gray-600">
                                                {a.doctor_name}
                                            </td>

                                            <td className="py-4 px-2 text-gray-600">
                                                {formatDate(a.appointment_date)}
                                            </td>

                                            <td className="py-4 px-2">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                                                    ${
                                                        STATUS_COLORS[a.status] ||
                                                        "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {a.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-6">
                            <p className="text-sm text-gray-500">
                                Showing{" "}
                                {Math.min(
                                    (page - 1) * PER_PAGE + 1,
                                    appointments.length
                                )}
                                –
                                {Math.min(
                                    page * PER_PAGE,
                                    appointments.length
                                )}{" "}
                                of {appointments.length}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>

                                <span className="text-sm text-slate-600 font-medium">
                                    {page} / {totalPages || 1}
                                </span>

                                <button
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}