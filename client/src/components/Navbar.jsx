import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, LogOut, User, Menu, X } from "lucide-react";
import demoImage from "../assets/demo.jpg";

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
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const links = NAV_LINKS[role] || [];
    const dashboardPath = `/${role}`;

    // Close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsProfileOpen(false);
            }
        }
        if (isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileOpen]);

    return (
        <header className="sticky top-0 z-50 w-full">
            <nav className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex py-2.5 items-center justify-between rounded-2xl border-b border-white/20 bg-white/80 px-8 shadow-lg backdrop-blur-md transition-all mt-4">
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
                        <div className="hidden lg:flex items-center gap-3">
                            {links.map((link, index) => (
                                <React.Fragment key={link.path}>
                                    <NavLink
                                        to={link.path}
                                        isActive={
                                            location.pathname ===
                                            `/${role}/${link.path}`
                                        }
                                    >
                                        {link.name}
                                    </NavLink>
                                    <div className="h-1 w-1 bg-slate-400 rounded-full" />
                                </React.Fragment>
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

                        <div className="hidden lg:block h-6 w-px bg-slate-400" />

                        {/* Profile Section */}
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Button */}
                            <motion.button
                                className="lg:hidden p-2 text-slate-600 hover:text-[#127fec] transition-colors"
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                            >
                                {isMobileMenuOpen ? (
                                    <X size={24} />
                                ) : (
                                    <Menu size={24} />
                                )}
                            </motion.button>

                            {/* Profile Dropdown */}
                            <div className="relative z-100" ref={dropdownRef}>
                                <motion.button
                                    onClick={() =>
                                        setIsProfileOpen(!isProfileOpen)
                                    }
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative rounded-full focus:outline-none p-1"
                                >
                                    <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-slate-200 hover:ring-[#127fec] transition-all duration-200">
                                        <img
                                            src={demoImage}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </motion.button>

                                <AnimatePresence className="p-0">
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.95,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: 10,
                                                scale: 0.95,
                                            }}
                                            className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl p-2 z-50"
                                        >
                                            <motion.button
                                                whileHover={{
                                                    x: 3,
                                                    backgroundColor:
                                                        "rgba(18, 127, 236, 0.05)",
                                                    border: "1px solid #127fec",
                                                }}
                                                whileTap={{ scale: 0.97 }}
                                                transition={{ duration: 0.2 }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-[#127fec] rounded-lg transition-colors font-medium"
                                            >
                                                <User size={18} />
                                                Profile
                                            </motion.button>

                                            <div className="h-px mx-2 my-1 bg-slate-300" />

                                            <motion.button
                                                whileHover={{
                                                    x: 3,
                                                    backgroundColor:
                                                        "rgba(239, 68, 68, 0.05)",
                                                    border: "1px solid red",
                                                }}
                                                whileTap={{ scale: 0.97 }}
                                                transition={{ duration: 0.2 }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:text-red-600 rounded-lg transition-colors font-medium"
                                            >
                                                <LogOut size={18} />
                                                Sign Out
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="lg:hidden overflow-hidden bg-white/90 backdrop-blur-md rounded-2xl mt-2 border border-white/20 shadow-lg"
                        >
                            <div className="flex flex-col p-4 gap-2">
                                {links.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                            location.pathname ===
                                            `/${role}/${link.path}`
                                                ? "bg-[#127fec]/10 text-[#127fec]"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-[#127fec]"
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <div className="h-px bg-slate-200 my-2" />

                                <Link
                                    to={dashboardPath}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-full"
                                >
                                    <button
                                        className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #0a5bbf, #127fec)",
                                        }}
                                    >
                                        {role.charAt(0).toUpperCase() +
                                            role.slice(1)}{" "}
                                        Dashboard
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}
