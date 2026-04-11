import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PhoneOff, Video, FileText, Upload } from "lucide-react";
import appointmentService from "../../api/appointmentService";

export default function DoctorConsultation() {
    const navigate = useNavigate();
    const { id } = useParams();

    const localVideoRef = useRef(null);
    const streamRef = useRef(null);

    const [appointment, setAppointment] = useState(null);
    const [fileName, setFileName] = useState("");

    // Start camera + load data
    useEffect(() => {
        startCamera();
        loadAppointment();

        return () => {
            stopCamera();
        };
    }, []);

    // Load appointment data
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

    // Start camera
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            streamRef.current = mediaStream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) =>
                track.stop()
            );
            streamRef.current = null;
        }

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
    };

    // End call
    const handleEndCall = () => {
        stopCamera();
        navigate("/doctor/appointments");
    };

    //  Upload Prescription
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);

        console.log("Selected file:", file);

        
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] p-6 grid lg:grid-cols-4 gap-6">

            {/* LEFT SIDE */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6 flex flex-col">

                <h2 className="text-lg font-semibold mb-4">
                    Consultation Room
                </h2>

                {/* Video Area */}
                <div className="flex-1 bg-black rounded-xl flex items-center justify-center relative">

                    <span className="text-white text-sm">
                        Waiting for patient...
                    </span>

                    {/* Local Video */}
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="absolute bottom-4 right-4 w-40 h-28 rounded-lg object-cover border border-white"
                    />
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={handleEndCall}
                        className="px-5 py-2 bg-red-500 hover:bg-red-600 transition text-white rounded-full flex items-center gap-2"
                    >
                        <PhoneOff size={16} />
                        End Call
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="bg-white rounded-2xl shadow p-6 space-y-6">

                {/* Patient Info */}
                <div>
                    <h3 className="font-semibold mb-2">Patient Info</h3>
                    <div className="bg-slate-100 p-3 rounded-xl">
                        <p className="font-medium">
                            {appointment?.patient_name || "Loading..."}
                        </p>
                        <p className="text-sm text-slate-500">
                            {appointment?.appointment_date || ""}
                        </p>
                    </div>
                </div>

                {/* Video Button */}
                <button className="w-full bg-blue-50 hover:bg-blue-100 transition p-3 rounded-xl flex gap-2 items-center text-sm">
                    <Video size={16}/> Video Call
                </button>

                {/* Files */}
                <button className="w-full bg-slate-50 hover:bg-slate-100 transition p-3 rounded-xl flex gap-2 items-center text-sm">
                    <FileText size={16}/> Files
                </button>

                {/* Upload Prescription */}
                <label className="border-2 border-dashed p-4 rounded-xl text-center text-sm cursor-pointer hover:bg-slate-50 block">
                    <Upload size={16} className="mx-auto mb-1"/>
                    Upload Prescription

                    <input
                        type="file"
                        accept="image/*,.pdf"
                        hidden
                        onChange={handleFileUpload}
                    />
                </label>

                {/* Show file name */}
                {fileName && (
                    <p className="text-xs text-slate-500 text-center">
                        Selected: {fileName}
                    </p>
                )}

                {/* Notes */}
                <textarea
                    placeholder="Write notes..."
                    className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows={4}
                ></textarea>

            </div>
        </div>
    );
}