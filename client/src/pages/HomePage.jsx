import { Link } from "react-router-dom";
import { Shield, Video, Zap, Plus } from "lucide-react";
import "./HomePage.css";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">

            {/* ================= NAVBAR ================= */}
            <nav className="flex items-center justify-between px-10 py-5 bg-white shadow-sm">
                {/* LOGO */}
                <div className="nav-logo">PulsePortal</div>

                {/* NAV LINKS */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <a href="#" className="nav-link">Find a Doctor</a>
                    <a href="#" className="nav-link">Appointments</a>
                    <a href="#" className="nav-link">Telehealth</a>
                    <a href="#" className="nav-link">Services</a>
                </div>

                {/* LOGIN BUTTON */}
                <Link to="/auth" className="primary-btn">Patient Login</Link>
            </nav>

            {/* ================= HERO SECTION ================= */}
            <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">

                {/* Left Image */}
                <div className="rounded-3xl overflow-hidden shadow-lg">
                    <img
                        src="https://png.pngtree.com/thumb_back/fh260/background/20240619/pngtree-room-at-hospital-blurry-background-image_15799690.jpg"
                        alt="hospital corridor"
                        className="w-full h-[350px] object-cover"
                    />
                </div>

                {/* Right Content */}
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
                        Secure Healthcare <br /> for the Digital Age
                    </h1>
                    <p className="text-slate-600 mb-6 max-w-md">
                        Experience the future of medicine with end-to-end
                        encrypted records and AI-assisted diagnostics.
                        Your health, secured.
                    </p>

                    <button className="primary-btn">Book Appointment</button>
                </div>
            </section>

            {/* ================= AI HEALTH ASSISTANT ================= */}
            <section className="max-w-5xl mx-auto px-6 py-10">
                <div className="bg-white rounded-3xl shadow-md p-10 text-center">

                    <div className="flex items-center justify-center gap-2 text-xl font-bold mb-4">
                        <Plus className="primary-icon" size={22} />
                        AI Health Assistant
                    </div>

                    <p className="text-slate-500 mb-6">
                        Tell us your symptoms, and our AI will find the right specialist for you instantly.
                    </p>

                    <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 max-w-xl mx-auto">
                        <input
                            type="text"
                            placeholder="Describe your symptoms (e.g., I have a headache and fever)"
                            className="flex-1 bg-transparent outline-none text-sm"
                        />
                        <button className="primary-btn">Analyze</button>
                    </div>

                    <div className="flex justify-center gap-6 text-xs text-slate-400 mt-6">
                        <span>HIPAA Compliant</span>
                        <span>End-to-End Encryption</span>
                    </div>
                </div>
            </section>

            
            <section className="max-w-6xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold mb-2">Why Choose PulsePortal?</h2>
                <p className="text-slate-500 mb-10">
                    Modern solutions for modern healthcare needs.
                </p>

                <div className="grid md:grid-cols-3 gap-6">

                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <Shield className="primary-icon mb-4" size={24} />
                        <h3 className="font-semibold mb-2">24/7 Encryption</h3>
                        <p className="text-sm text-slate-500">
                            Your data is secured with military-grade encryption protocols.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <Video className="primary-icon mb-4" size={24} />
                        <h3 className="font-semibold mb-2">Telehealth Ready</h3>
                        <p className="text-sm text-slate-500">
                            Connect with top-rated specialists from your home.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <Zap className="primary-icon mb-4" size={24} />
                        <h3 className="font-semibold mb-2">Instant Lab Results</h3>
                        <p className="text-sm text-slate-500">
                            Access AI-analyzed diagnostic reports instantly.
                        </p>
                    </div>

                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="bg-white border-t py-8 text-center text-sm">
                <div className="flex justify-center gap-8 mb-4">
                    <a href="#" className="footer-link">Privacy Policy</a>
                    <a href="#" className="footer-link">Terms of Service</a>
                    <a href="#" className="footer-link">Contact Us</a>
                </div>

                <p className="text-slate-500">© 2025 PulsePortal. All rights reserved.</p>
            </footer>
        </div>
    );
}

