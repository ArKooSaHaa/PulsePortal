// ─────────────────────────────────────────────────────────────
// AuthPage.jsx
//
// This page combines:
//   1. Animated Background (blobs)
//   2. Left Panel (information & visuals)
//   3. Auth Form (right side interaction)
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLES } from "../config/roles";

// AnimatedBackground
function AnimatedBackground({ role, cfg }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={role}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 -z-10"
                style={{
                    background:
                        "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
                }}
            >
                <motion.div
                    animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute -top-[10%] -left-[5%] w-[50%] h-[50%] rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${cfg.meshA} 0%, transparent 70%)`,
                        opacity: 0.4,
                        filter: "blur(80px)",
                    }}
                />
                {/* Blob B */}
                <motion.div
                    animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 3,
                    }}
                    className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${cfg.meshB} 0%, transparent 70%)`,
                        opacity: 0.35,
                        filter: "blur(70px)",
                    }}
                />
                {/* Blob C */}
                <motion.div
                    animate={{ x: [0, 15, 0], y: [0, 12, 0] }}
                    transition={{
                        duration: 16,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 6,
                    }}
                    className="absolute top-[30%] -right-[5%] w-[40%] h-[40%] rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${cfg.meshC} 0%, transparent 70%)`,
                        opacity: 0.3,
                        filter: "blur(60px)",
                    }}
                />
            </motion.div>
        </AnimatePresence>
    );
}

// Left Panel (Heart Pulse & Headings)
function HeartbeatPulse({ color }) {
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setOffset((prev) => (prev + 4) % 800);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const heartbeatPath = `
    M 0,60
    L 150,60
    L 165,60
    L 175,30
    L 185,90
    L 195,40
    L 205,60
    L 400,60
  `;
    return (
        <div className="w-full h-32 relative overflow-hidden bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-200">
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: `
            linear-gradient(${color}40 2px, transparent 2px),
            linear-gradient(90deg, ${color}40 2px, transparent 2px)
          `,
                    backgroundSize: "20px 20px",
                }}
            />
            <svg
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 800 120"
            >
                {[0, 1, 2, 3].map((i) => (
                    <motion.path
                        key={i}
                        d={heartbeatPath}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ x: i * 400 - offset }}
                        animate={{ x: i * 400 - offset }}
                        transition={{ duration: 0 }}
                    />
                ))}
            </svg>
        </div>
    );
}
function LeftPanel({ role, cfg }) {
    return (
        <div className="flex-1 flex flex-col justify-center gap-6 py-10">
            <AnimatePresence mode="wait">
                <h2>HealthCare at hoem</h2>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.div
                    key={role}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                >
                    <HeartbeatPulse color={cfg.pulseColor} />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default function AuthPage() {
    const [role, setRole] = useState("doctor");
    const cfg = ROLES[role];

    return (
        <div className="min-h-screen w-full flex overflow-hidden relative font-sans">
            <AnimatedBackground role={role} cfg={cfg} />
            <LeftPanel role={role} cfg={cfg} />
        </div>
    );
}
