import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse } from "lucide-react";

const NAV_LINKS = {
    patient: [
        { name: "My Appointments", path: "appointments" },
        { name: "History", path: "history" },
        { name: "Book Appointment", path: "book-appointment" },
    ],
    doctor: [
        { name: "Appointments", path: "doc-appointments" },
        { name: "Patients", path: "doc-patients" },
    ],
    admin: [
        // { name: "Manage Doctors", path: "manage-doctors" }
    ],
};

function NavLink({ to, children, isActive }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.2 }}
        >
            <Link
                to={to}
                className={`relative px-0 mx-2 py-2 text-sm transition-colors block ${
                    isActive
                        ? "font-bold text-[#127fec] hover:text-[#127fec]"
                        : "font-medium text-slate-600 hover:text-[#127fec]"
                }`}
            >
                {children}
                {isActive ? (
                    <motion.div
                        className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#127fec]"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                ) : (
                    <motion.div
                        className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#127fec] origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </Link>
        </motion.div>
    );
}

export default function Navbar() {
    const { role } = useParams();
    const location = useLocation();

    const links = NAV_LINKS[role] || [];
    const dashboardPath = `/${role}`;

    return (
        <header className="sticky top-0 z-50 w-full">
            <nav className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex py-4 items-center justify-between rounded-2xl border-b border-white/20 bg-white/80 px-8 shadow-lg backdrop-blur-md transition-all mt-4">
                    {/* Logo Section */}
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="flex text-xl font-bold tracking-tight text-slate-800 font-display">
                                <HeartPulse size={30} className="mr-2" />
                                PulsePortal
                            </span>
                        </Link>
                    </div>

                    {/* Right Side: Navigation & Profile */}
                    <div className="flex items-center gap-6">
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-4">
                            {links.map((link, index) => (
                                <>
                                    <NavLink
                                        key={link.path}
                                        to={link.path}
                                        isActive={
                                            location.pathname ===
                                            `/${role}/${link.path}`
                                        }
                                    >
                                        {link.name}
                                    </NavLink>
                                    {index < links.length - 1 && (
                                        <div className="h-1 w-1 bg-slate-400 rounded-full" />
                                    )}
                                </>
                            ))}

                            {/* Dashboard Button */}
                            <Link to={dashboardPath}>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.6 }}
                                    className="px-4 py-2 rounded-full text-sm font-bold text-white shadow-md transition-all hover:shadow-lg focus:outline-none"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #0a5bbf, #127fec)",
                                    }}
                                >
                                    {role.charAt(0).toUpperCase() +
                                        role.slice(1)}{" "}
                                    Dashboard
                                </motion.button>
                            </Link>
                        </div>

                        <div className="h-6 w-px bg-slate-400" />
                    </div>
                </div>
            </nav>
        </header>
    );
}
