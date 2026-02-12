// ─────────────────────────────────────────────────────────────
// AuthPage.jsx
//
// This page combines:
//   1. Animated Background (blobs)
//   2. Left Panel (information & visuals)
//   3. Auth Form (right side interaction)
// ─────────────────────────────────────────────────────────────

import { motion, AnimatePresence } from "framer-motion";
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
                        "linear-gradient(135deg, #0080ffff 0%, #F1F5F9 100%)",
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

export default function AuthPage() {
    return(
        <div>
            <AnimatedBackground role={role} cfg={cfg}/>
        </div>

    );
}