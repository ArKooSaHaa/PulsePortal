import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function PatientConsultation() {
    const navigate = useNavigate();
    const { id } = useParams();

    const localVideoRef = useRef(null);
    const streamRef = useRef(null);

    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);

    // NEW STATES (FIXED)
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const [prescriptions] = useState([
        "Amoxicillin 500mg - 2x daily",
        "Paracetamol 500mg - after meal"
    ]);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            streamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const toggleMic = () => {
        const stream = streamRef.current;
        if (!stream) return;

        stream.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
        });

        setMicOn(prev => !prev);
    };

    const toggleVideo = () => {
        const stream = streamRef.current;
        if (!stream) return;

        stream.getVideoTracks().forEach(track => {
            track.enabled = !track.enabled;
        });

        setVideoOn(prev => !prev);
    };

    const handleEndCall = () => {
        stopCamera();
        navigate("/patient/appointments");
    };

    // FIXED CHAT
    const sendMessage = () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, input]);
        setInput("");
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 flex gap-4">

            {/* ================= LEFT: FULL VIDEO ================= */}
            <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-xl relative">

                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-screen object-cover"
                />

                <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                    Consultation ID: {id}
                </div>

                {/* Controls */}
                <div className="absolute bottom-4 w-full flex justify-center gap-4">

                    <button onClick={toggleMic}
                        className="p-3 bg-white/20 rounded-full text-white">
                        {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>

                    <button onClick={toggleVideo}
                        className="p-3 bg-white/20 rounded-full text-white">
                        {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>

                    <button onClick={handleEndCall}
                        className="p-3 bg-red-500 rounded-full text-white">
                        <PhoneOff size={18} />
                    </button>

                </div>
            </div>

            {/* ================= RIGHT PANEL ================= */}
            <div className="w-[320px] bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-4">

                {/* Upload */}
                <label className="border-2 border-dashed rounded-xl p-4 text-center text-sm text-gray-600 cursor-pointer hover:bg-gray-50">
                    <input type="file" className="hidden" />
                    Click to Upload Files
                </label>

                {/* Prescription  */}
                <div>
                    <h3 className="text-sm font-semibold mb-2">Prescription</h3>
                    <div className="space-y-2">
                        {prescriptions.map((p, i) => (
                            <div key={i} className="bg-gray-100 p-2 rounded text-sm">
                                {p}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto">
                    <h3 className="text-sm font-semibold mb-2">Chat</h3>

                    <div className="space-y-2">
                        {messages.map((msg, i) => (
                            <div key={i} className="text-xs bg-blue-100 p-2 rounded">
                                {msg}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type message..."
                        className="flex-1 border rounded-lg p-2 text-sm"
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-500 text-white px-3 rounded-lg text-sm"
                    >
                        Send
                    </button>
                </div>

            </div>
        </div>
    );
}