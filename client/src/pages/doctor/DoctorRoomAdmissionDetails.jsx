import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BedDouble, Clock, FileText, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import doctorAppointmentService from "../../api/doctorAppointmentService";

const toStatusLabel = (value) => {
  const status = String(value || "admitted").toLowerCase();
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const toStatusClass = (value) => {
  const status = String(value || "admitted").toLowerCase();

  if (status === "discharged") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-emerald-100 text-emerald-700";
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const withFallback = (value, fallback = "Not provided") => {
  if (!value || !String(value).trim()) {
    return fallback;
  }

  return value;
};

export default function DoctorRoomAdmissionDetails() {
  const navigate = useNavigate();
  const { admissionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [admission, setAdmission] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const parsedId = Number(admissionId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setLoading(false);
      setError("Invalid room admission id.");
      return;
    }

    const loadDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await doctorAppointmentService.getRoomAdmissionDetails(parsedId);

        if (!cancelled) {
          setAdmission(data);
        }
      } catch (err) {
        if (!cancelled) {
          setAdmission(null);
          setError(
            err.response?.data?.message ||
              "Unable to load room admission details right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [admissionId]);

  return (
    <div className="min-h-screen bg-[#eff6ff] px-4 sm:px-8 lg:px-12 py-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => navigate("/doctor")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a5bbf] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl bg-white border border-slate-100 shadow-sm p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                Room Admission Details
              </p>
              <h1 className="text-2xl font-bold text-slate-800 mt-1">
                {loading
                  ? "Loading..."
                  : admission
                    ? `Room ${admission.roomNumber || "-"}`
                    : "Room Admission"}
              </h1>
            </div>
            {admission && !loading && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${toStatusClass(admission.status)}`}
              >
                {toStatusLabel(admission.status)}
              </span>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-white p-4 text-red-500 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-2xl bg-white border border-slate-100 shadow-sm p-6 text-slate-500">
            Loading room admission details...
          </div>
        )}

        {!loading && admission && (
          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <BedDouble size={18} className="text-[#127fec]" />
                <h2 className="text-lg font-semibold text-slate-800">Admission Timeline</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Admitted At
                  </p>
                  <p className="text-slate-700 font-medium mt-2">
                    {formatDateTime(admission.admittedAt)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Expected Discharge
                  </p>
                  <p className="text-slate-700 font-medium mt-2">
                    {formatDateTime(admission.expectedDischargeAt)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Discharged At
                  </p>
                  <p className="text-slate-700 font-medium mt-2">
                    {formatDateTime(admission.dischargedAt)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Last Updated
                  </p>
                  <p className="text-slate-700 font-medium mt-2">
                    {formatDateTime(admission.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-[#127fec]" />
                    <p className="font-semibold text-slate-700">Admission Reason</p>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {withFallback(admission.admissionReason)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-[#127fec]" />
                    <p className="font-semibold text-slate-700">Clinical Notes</p>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {withFallback(admission.admissionNotes)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-[#127fec]" />
                    <p className="font-semibold text-slate-700">Discharge Notes</p>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-line">
                    {withFallback(admission.dischargeNotes)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Room Information
                </p>
                <p className="text-lg font-bold text-slate-800 mt-2">
                  Room {admission.roomNumber || "-"}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {withFallback(admission.roomType, "General")} · Floor {admission.floorNumber || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserRound size={16} className="text-[#127fec]" />
                  <p className="font-semibold text-slate-800">Patient Information</p>
                </div>
                <p className="text-sm text-slate-700 font-medium">{admission.patientName}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {withFallback(admission.patientEmail, "No email available")}
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Assigned Doctor
                </p>
                <p className="text-sm text-slate-700 font-medium mt-2">
                  {withFallback(admission.doctorName, "You")}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {withFallback(admission.doctorDepartment, "Department not specified")}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
