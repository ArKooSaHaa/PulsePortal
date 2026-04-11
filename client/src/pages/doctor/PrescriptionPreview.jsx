import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import appointmentService from "../../api/appointmentService";

export default function PrescriptionPreview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [medicines, setMedicines] = useState([
        { name: "", dosage: "", instruction: "" },
    ]);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        loadAppointment();
    }, [id]);

    const loadAppointment = async () => {
        try {
            const data = await appointmentService.getDoctorAppointments();
            const selected = data.find(
                (item) => item.id.toString() === id
            );
            setAppointment(selected);
        } catch (err) {
            console.error(err);
        }
    };

    const addMedicine = () => {
        setMedicines([
            ...medicines,
            { name: "", dosage: "", instruction: "" },
        ]);
    };

    const handleChange = (index, field, value) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);
    };

    const removeMedicine = (index) => {
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 flex justify-center">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-lg p-8">

                {/* ===== TITLE ===== */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-wide">
                        PRESCRIPTION
                    </h1>
                </div>

                {/* ===== DATE + DOC ID ===== */}
                <div className="flex justify-end gap-4 mt-6">
                    <div className="border px-4 py-2 rounded-xl text-sm shadow-sm">
                        <p className="text-slate-500 text-xs">Date</p>
                        <p className="font-medium">
                            {appointment?.date || "—"}
                        </p>
                    </div>

                    <div className="border px-4 py-2 rounded-xl text-sm shadow-sm">
                        <p className="text-slate-500 text-xs">Doctor ID</p>
                        <p className="font-medium">
                            {appointment?.doctor_id || "—"}
                        </p>
                    </div>
                </div>

                {/* ===== DOCTOR INFO BOX ===== */}
                <div className="mt-6 border rounded-xl p-4 flex justify-between bg-slate-50">
                    <div>
                        <p className="text-xs text-slate-500">Doctor Name</p>
                        <p className="font-semibold">
                             {appointment?.doctor_name || "Loading..."}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500">Speciality</p>
                        <p className="font-semibold">
                            {appointment?.doctor_speciality || "—"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500">License No.</p>
                        <p className="font-semibold">
                            {appointment?.doctor_license || "—"}
                        </p>
                    </div>
                </div>

                {/* ===== PATIENT INFO BOX ===== */}
                <div className="mt-6 border rounded-xl p-4 flex justify-between bg-slate-50">
                    <div>
                        <p className="text-xs text-slate-500">Patient Name</p>
                        <p className="font-semibold">
                            {appointment?.patient_name || "Loading..."}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-slate-500">Patient ID</p>
                        <p className="font-semibold">
                            {appointment?.id || "—"}
                        </p>
                    </div>
                </div>

                {/* ===== MEDICINES ===== */}
                <div className="mt-6">
                    <h3 className="font-semibold mb-3">Medicines</h3>

                    {medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-3 gap-3 mb-3">
                            <input
                                className="border rounded-lg p-2"
                                placeholder="Medicine Name"
                                value={med.name}
                                onChange={(e) =>
                                    handleChange(index, "name", e.target.value)
                                }
                            />

                            <input
                                className="border rounded-lg p-2"
                                placeholder="Dosage"
                                value={med.dosage}
                                onChange={(e) =>
                                    handleChange(index, "dosage", e.target.value)
                                }
                            />

                            <div className="flex gap-2">
                                <input
                                    className="border rounded-lg p-2 w-full"
                                    placeholder="Instruction"
                                    value={med.instruction}
                                    onChange={(e) =>
                                        handleChange(index, "instruction", e.target.value)
                                    }
                                />

                                <button
                                    onClick={() => removeMedicine(index)}
                                    className="px-3 rounded-lg bg-red-100 text-red-500"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addMedicine}
                        className="text-blue-600 text-sm mt-2"
                    >
                        + Add Medicine
                    </button>
                </div>

                {/* ===== NOTES ===== */}
                <div className="mt-6">
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <textarea
                        className="w-full border rounded-xl p-3"
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write doctor's notes..."
                    />
                </div>

                {/* ===== BUTTONS ===== */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                    >
                        Back
                    </button>

                    <button
                        onClick={() => {
                            console.log({ appointment, medicines, notes });
                            alert("Prescription Saved!");
                        }}
                        className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg hover:from-blue-600 hover:to-blue-800 transition"
                    >
                        Save Prescription
                    </button>
                </div>

            </div>
        </div>
    );
}