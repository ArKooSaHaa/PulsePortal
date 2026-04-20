import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    CheckCircle,
    Loader2,
    ArrowLeft,
    FileText,
    User,
    Pill,
    Printer,
} from "lucide-react";
import appointmentService from "../../api/appointmentService";

const Motion = motion;

export default function PrescriptionPreview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [loadingAppt, setLoadingAppt] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [error, setError] = useState("");

    const [diagnosis, setDiagnosis] = useState("");
    const [medicines, setMedicines] = useState([
        { name: "", dosage: "", instruction: "" },
    ]);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        appointmentService
            .getDoctorAppointments()
            .then((data) => {
                const found = data.find((a) => a.id.toString() === id);
                setAppointment(found || null);
            })
            .catch(() => setError("Failed to load appointment."))
            .finally(() => setLoadingAppt(false));
    }, [id]);

    const addMedicine = () =>
        setMedicines((prev) => [...prev, { name: "", dosage: "", instruction: "" }]);

    const removeMedicine = (i) =>
        setMedicines((prev) => prev.filter((_, idx) => idx !== i));

    const handleChange = (index, field, value) => {
        setMedicines((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSave = async () => {
        setError("");
        const validMeds = medicines.filter((m) => m.name.trim() !== "");
        if (validMeds.length === 0) {
            setError("Please add at least one medicine.");
            return;
        }

        setSaving(true);
        try {
            await appointmentService.uploadPrescription(id, {
                disease_or_problem: diagnosis,
                medicines: validMeds,
                notes,
            });
            setSaved(true);
        } catch (err) {
            setError(
                err?.response?.data?.message || "Failed to save prescription. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePrintPdf = async () => {
        setError("");
        setPrinting(true);

        try {
            const pdfBlob = await appointmentService.getDoctorPrescriptionPdf(id);
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(pdfUrl, "_blank", "noopener,noreferrer");

            if (!printWindow) {
                URL.revokeObjectURL(pdfUrl);
                setError("Popup blocked. Please allow popups and try again.");
                return;
            }

            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
            };

            setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    "Failed to generate printable PDF. Please try again.",
            );
        } finally {
            setPrinting(false);
        }
    };

    const today = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    if (loadingAppt) {
        return (
            <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center">
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Loading appointment...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#eff6ff] py-8 px-4">
            {/* Success Overlay */}
            <AnimatePresence>
                {saved && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-10 flex flex-col items-center gap-4 shadow-2xl w-[92%] max-w-md"
                        >
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                <CheckCircle size={36} className="text-green-500" />
                            </div>
                            <p className="text-xl font-bold text-slate-800">Prescription Saved!</p>
                            <p className="text-sm text-slate-500 text-center">
                                Appointment marked as completed. You can print the prescription PDF now.
                            </p>

                            <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handlePrintPdf}
                                    disabled={printing}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #127fec, #0a5bbf)",
                                    }}
                                >
                                    {printing ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            Preparing PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Printer size={15} />
                                            Print PDF
                                        </>
                                    )}
                                </motion.button>
                                <button
                                    onClick={() => navigate("/doctor/appointments")}
                                    className="flex-1 px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                                >
                                    Back to Appointments
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to appointments
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden"
                >
                    {/* Header Banner */}
                    <div
                        className="px-8 py-6 text-white"
                        style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-wide">PRESCRIPTION</h1>
                                    <p className="text-blue-100 text-xs mt-0.5">PulsePortal Medical System</p>
                                </div>
                            </div>
                            <div className="text-right text-sm text-blue-100">
                                <p className="font-semibold text-white">{today}</p>
                                <p className="text-xs mt-0.5">Appointment #{id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Patient & Doctor Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <User size={14} className="text-[#127fec]" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Patient
                                    </p>
                                </div>
                                <p className="font-bold text-slate-800 text-lg">
                                    {appointment?.patient_name || "—"}
                                </p>
                                {appointment?.symptoms && (
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                        <span className="font-semibold">Symptoms:</span>{" "}
                                        {appointment.symptoms}
                                    </p>
                                )}
                            </div>

                            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <FileText size={14} className="text-indigo-500" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Diagnosis
                                    </p>
                                </div>
                                <input
                                    type="text"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="Enter diagnosis / disease..."
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127fec]/30 focus:border-[#127fec] transition"
                                />
                            </div>
                        </div>

                        {/* Medicines */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Pill size={14} className="text-[#127fec]" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800">Medicines</h3>
                                </div>
                                <button
                                    onClick={addMedicine}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[#127fec] hover:bg-blue-50 px-3 py-1.5 rounded-full border border-[#127fec]/30 transition"
                                >
                                    <Plus size={13} /> Add Medicine
                                </button>
                            </div>

                            {/* Column Headers */}
                            <div className="grid grid-cols-12 gap-3 mb-2 px-1">
                                <div className="col-span-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    Medicine Name *
                                </div>
                                <div className="col-span-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    Dosage
                                </div>
                                <div className="col-span-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                    Instructions
                                </div>
                                <div className="col-span-1" />
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {medicines.map((med, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="grid grid-cols-12 gap-3 items-center"
                                        >
                                            <input
                                                className="col-span-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127fec]/30 focus:border-[#127fec] transition"
                                                placeholder="e.g. Paracetamol"
                                                value={med.name}
                                                onChange={(e) =>
                                                    handleChange(index, "name", e.target.value)
                                                }
                                            />
                                            <input
                                                className="col-span-3 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127fec]/30 focus:border-[#127fec] transition"
                                                placeholder="e.g. 500mg twice daily"
                                                value={med.dosage}
                                                onChange={(e) =>
                                                    handleChange(index, "dosage", e.target.value)
                                                }
                                            />
                                            <input
                                                className="col-span-4 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127fec]/30 focus:border-[#127fec] transition"
                                                placeholder="e.g. After meals"
                                                value={med.instruction}
                                                onChange={(e) =>
                                                    handleChange(index, "instruction", e.target.value)
                                                }
                                            />
                                            <button
                                                onClick={() => removeMedicine(index)}
                                                disabled={medicines.length === 1}
                                                className="col-span-1 flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-3">Doctor's Notes</h3>
                            <textarea
                                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#127fec]/30 focus:border-[#127fec] transition resize-none"
                                rows={4}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes, lifestyle advice, follow-up instructions..."
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-500 text-sm px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSave}
                                disabled={saving || saved}
                                className="flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-semibold shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition"
                                style={{ background: "linear-gradient(135deg, #127fec, #0a5bbf)" }}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Save & Complete Appointment
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}