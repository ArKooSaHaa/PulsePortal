// ─────────────────────────────────────────────────────────────
// AuthForm.jsx
//
// The main card that holds:
//   • The role tabs (Patient / Doctor / Admin)
//   • Login and Sign Up forms
//   • Submit button + OAuth buttons
//   • Toggle between Login and Sign Up modes
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLES } from "../config/roles";

// Handling different role tabs
function RoleTabs({ activeRole, onRoleChange }) {
    return (
        <div className="flex items-center bg-slate-100/80 border border-slate-200 rounded-2xl p-1 mb-7">
            {Object.entries(ROLES).map(([key, cfg]) => {
                const isActive = activeRole === key;

                return (
                    <motion.button
                        key={key}
                        onClick={() => onRoleChange(key)}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border-none bg-transparent outline-none focus:outline-none ring-0 focus:ring-0"
                        style={{
                            color: isActive
                                ? cfg.accent
                                : "rgba(71,85,105,0.6)",
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="roleTabBg"
                                className="absolute inset-0 rounded-xl bg-white shadow-sm"
                                style={{
                                    border: `1px solid ${cfg.accent}30`,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 28,
                                }}
                            />
                        )}

                        <span className="relative z-10 flex items-center gap-1.5">
                            {cfg.label}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}

// Input Fields
function InputField({ label, placeholder, type = "text", accent, accentGlow }) {
    const [focused, setFocused] = useState(false);

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest ml-1">
                {label}
            </label>

            {/* Animated Wrapper */}
            <motion.div
                animate={{
                    boxShadow: focused
                        ? `0 0 0 2px ${accent}, 0 0 16px ${accentGlow}`
                        : "0 0 0 1px #E2E8F0",
                }}
                className="rounded-xl overflow-hidden"
            >
                <input
                    id={label}
                    type={type}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="
                                w-full
                                bg-white/70
                                hover:bg-white/90
                                focus:bg-white
                                text-slate-800 text-sm
                                px-4 py-3
                                rounded-xl
                                border-none outline-none
                                transition-colors duration-200
                                font-sans
                            "
                    style={{ caretColor: accent }}
                />
            </motion.div>
        </div>
    );
}

export default function AuthForm({ activeRole, onRoleChange }) {
    const [internalRole, setInternalRole] = useState("patient");

    const role = activeRole || internalRole;

    const handleRoleChange = (newRole) => {
        if (onRoleChange) {
            onRoleChange(newRole);
        } else {
            setInternalRole(newRole);
        }
    };

    // Mode - login/registration
    const [mode, setMode] = useState("login");
    const cfg = ROLES[role];

    return (
        <motion.div
            layout
            className="w-full max-w-md rounded-3xl p-8 lg:p-10 relative overflow-hidden shadow-xl"
            style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(226,232,240,0.8)",
            }}
        >
            {/* Card Accent Glow */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`glow-${role}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
                    style={{ background: cfg.accentGlow, filter: "blur(60px)" }}
                />
            </AnimatePresence>

            {/* Header */}
            <div className="relative z-10 mb-6">
                <motion.h1
                    key={mode + "title"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-extrabold text-slate-800 tracking-tight font-display"
                >
                    {mode === "login" ? "Welcome back" : "Create account"}
                </motion.h1>
                <motion.p
                    key={mode + "sub"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-600 text-sm mt-1.5 font-sans"
                >
                    {mode === "login"
                        ? "Sign in to your account"
                        : "Join thousands of healthcare professionals"}
                </motion.p>
            </div>

            <div className="relative z-10">
                <RoleTabs activeRole={role} onRoleChange={handleRoleChange} />
            </div>
        </motion.div>
    );
}
