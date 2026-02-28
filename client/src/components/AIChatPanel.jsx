import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Send,
    Bot,
    Stethoscope,
    AlertTriangle,
    CheckCircle,
    Clock,
    Sparkles,
} from "lucide-react";

/*  Mock data Data for ai response  */
const AI_RESPONSES = {
    default: {
        specialty: "General Medicine",
        urgency: "Urgent",
        summary: [
            "No immediately concerning patterns detected.",
            "A general practitioner visit is recommended.",
        ],
    },
    headache: {
        specialty: "Neurology",
        urgency: "Soon",
        summary: [
            "Headache symptoms should be evaluated if recurring.",
            "Rule out tension, migraine, or hypertension-related causes.",
        ],
    },
    fever: {
        specialty: "General Medicine",
        urgency: "Routine",
        summary: [
            "Fever may indicate infection — monitor temperature closely.",
            "Seek care if fever exceeds 39°C or persists beyond 3 days.",
        ],
    },
};

const URGENCY_CONFIG = {
    Routine: {
        color: "text-emerald-600",
        bg: "bg-emerald-50/80",
        border: "border-emerald-100",
        icon: CheckCircle,
    },
    Soon: {
        color: "text-amber-600",
        bg: "bg-amber-50/80",
        border: "border-amber-100",
        icon: Clock,
    },
    Urgent: {
        color: "text-red-600",
        bg: "bg-red-50/80",
        border: "border-red-100",
        icon: AlertTriangle,
    },
};

const CHIPS = [
    "Headache",
    "Fever",
    "Chest Pain",
    "Skin Issue",
    "General Checkup",
];

/* floating orb  */
function Orb({ size, color, x, y, duration, delay }) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                width: size,
                height: size,
                background: color,
                left: x,
                top: y,
                filter: "blur(40px)",
                opacity: 0.18,
            }}
            animate={{
                x: [0, 18, -12, 0],
                y: [0, -14, 10, 0],
                scale: [1, 1.08, 0.95, 1],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}
        />
    );
}

/*  Typing indicator  */
function TypingIndicator() {
    return (
        <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-[#127fec]" />
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                {[0, 0.22, 0.44].map((delay, i) => (
                    <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 block"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                            duration: 0.7,
                            repeat: Infinity,
                            delay,
                            ease: "easeInOut",
                        }}
                    />
                ))}
                <span className="text-xs text-slate-400 ml-1.5">
                    Generating response...
                </span>
            </div>
        </div>
    );
}

function AIResultCard({ result }) {
    const cfg = URGENCY_CONFIG[result.urgency] || URGENCY_CONFIG.Routine;
    const Icon = cfg.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mx-1 mt-1 rounded-2xl overflow-hidden rounded-bl-sm shadow-lg"
            style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(18,127,236,0.18)",
                boxShadow: "0 0 0 1px rgba(18,127,236,0.08), 0 8px 32px rgba(18,127,236,0.12)",
            }}
        >
            <div
                className="px-4 py-3 flex items-center gap-2 relative overflow-hidden"
                style={{
                    background:
                        "linear-gradient(135deg, rgba(239,246,255,0.9), rgba(219,234,254,0.9))",
                }}
            >
                <Sparkles size={14} className="text-[#127fec] relative z-10" />
                <p className="text-xs font-bold text-[#127fec] tracking-wider relative z-10">
                    AI Guidance Result
                </p>
            </div>

            <div className="px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 backdrop-blur-sm">
                        <Stethoscope size={12} className="text-[#127fec]" />
                        <span className="text-xs font-semibold text-[#127fec]">
                            {result.specialty}
                        </span>
                    </div>
                    <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm ${cfg.bg} ${cfg.border}`}
                    >
                        <Icon size={12} className={cfg.color} />
                        <span className={`text-xs font-semibold ${cfg.color}`}>
                            {result.urgency}
                        </span>
                    </div>
                </div>

                <ul className="flex flex-col gap-1.5 pl-1">
                    {result.summary.map((point, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                        >
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#127fec] flex-shrink-0" />
                            {point}
                        </li>
                    ))}
                </ul>
                {/* 
                <div className="flex gap-2 pt-1">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                        style={{
                            background:
                                "linear-gradient(135deg, #0a5bbf, #127fec)",
                        }}
                    >
                        <CalendarPlus size={13} /> Use for Booking
                    </motion.button>
                </div> */}
            </div>
        </motion.div>
    );
}

export default function AIChatPanel({ onClose }) {
    const [messages, setMessages] = useState([
        {
            id: 0,
            from: "ai",
            text: "Hi! I'm your AI Health Assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [showChips, setShowChips] = useState(true);
    const [resultCard, setResultCard] = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking, resultCard]);

    function getResult(text) {
        const lower = text.toLowerCase();
        for (const key of Object.keys(AI_RESPONSES)) {
            if (key !== "default" && lower.includes(key))
                return AI_RESPONSES[key];
        }
        return AI_RESPONSES.default;
    }

    function send(text) {
        const trimmed = (text ?? input).trim();
        if (!trimmed || isThinking) return;
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), from: "user", text: trimmed },
        ]);
        setInput("");
        setShowChips(false);
        setResultCard(null);
        setIsThinking(true);
        setTimeout(() => {
            setIsThinking(false);
            setResultCard(getResult(trimmed));
        }, 1800);
    }

    return (
        <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-[500px] z-50 flex flex-col overflow-hidden"
            style={{
                background: "rgba(255,255,255,0.88)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderLeft: "1px solid rgba(18,127,236,0.12)",
                boxShadow: "-8px 0 40px rgba(10,91,191,0.1)",
            }}
        >
            {/* Panel Header  */}
            <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0 relative overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #0a5bbf, #127fec)",
                }}
            >
                {/* shine sweep */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
                    }}
                    animate={{ x: ["-120%", "220%"] }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 2,
                    }}
                />
                <div className="flex items-center gap-3 relative z-10">
                    <motion.div
                        className="bg-white/20 rounded-full p-2"
                        animate={{
                            boxShadow: [
                                "0 0 0 0 rgba(255,255,255,0.3)",
                                "0 0 0 6px rgba(255,255,255,0)",
                                "0 0 0 0 rgba(255,255,255,0)",
                            ],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeOut",
                        }}
                    >
                        <Bot size={18} className="text-white" />
                    </motion.div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">
                            AI Health Assistant
                        </p>
                        <p className="text-white/70 text-[11px] mt-0.5">
                            Describe symptoms to get guidance before booking.
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="relative z-10 text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 focus:outline-none"
                >
                    <X size={18} />
                </button>
            </div>

            {/*  Chat area  */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 relative">
                {/* floating orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <Orb
                        size={180}
                        color="rgba(18,127,236,1)"
                        x="60%"
                        y="-5%"
                        duration={9}
                        delay={0}
                    />
                    <Orb
                        size={140}
                        color="rgba(10,91,191,1)"
                        x="-10%"
                        y="40%"
                        duration={12}
                        delay={2}
                    />
                    <Orb
                        size={120}
                        color="rgba(56,189,248,1)"
                        x="55%"
                        y="65%"
                        duration={10}
                        delay={1}
                    />
                </div>

                {/* Messages */}
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22 }}
                            className={`flex items-end gap-2 relative z-10 ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.from === "ai" && (
                                <div className="w-7 h-7 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                                    <Bot size={14} className="text-[#127fec]" />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                    msg.from === "user"
                                        ? "bg-[#127fec] text-white rounded-br-sm shadow-md"
                                        : "rounded-bl-sm shadow-sm"
                                }`}
                                style={
                                    msg.from === "ai"
                                        ? {
                                              background:
                                                  "rgba(255,255,255,0.72)",
                                              backdropFilter: "blur(16px)",
                                              WebkitBackdropFilter:
                                                  "blur(16px)",
                                              border: "1px solid rgba(18,127,236,0.18)",
                                              boxShadow:
                                                  "0 0 0 1px rgba(18,127,236,0.08), 0 8px 32px rgba(18,127,236,0.12)",
                                              color: "#334155",
                                          }
                                        : {}
                                }
                            >
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Suggestion chips */}
                <AnimatePresence>
                    {showChips && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex flex-wrap gap-2 mt-1 relative z-10"
                        >
                            {CHIPS.map((chip) => (
                                <button
                                    key={chip}
                                    onClick={() => send(chip)}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-[#127fec] transition-all shadow-sm focus:outline-none"
                                    style={{
                                        background: "rgba(255,255,255,0.7)",
                                        backdropFilter: "blur(8px)",
                                        WebkitBackdropFilter: "blur(8px)",
                                        border: "1px solid rgba(203,213,225,0.8)",
                                    }}
                                >
                                    {chip}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                    {isThinking && (
                        <motion.div
                            key="typing"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10"
                        >
                            <TypingIndicator />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Result card */}
                <AnimatePresence>
                    {resultCard && !isThinking && (
                        <div className="flex items-end gap-2 relative z-10">
                            <div className="w-7 h-7 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                                <Bot size={14} className="text-[#127fec]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <AIResultCard
                                    key="result"
                                    result={resultCard}
                                />
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* Input box */}
            <div
                className="flex-shrink-0 px-4 pt-3 pb-3"
                style={{
                    background: "rgba(255,255,255,0.75)",
                    borderTop: "1px solid rgba(203,213,225,0.5)",
                }}
            >
                <div className="flex items-center gap-2">
                    <input
                        className="flex-1 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127fec]/25 placeholder:text-slate-400 transition-all"
                        style={{
                            background: "rgba(248,250,252,0.8)",
                            border: "1px solid rgba(203,213,225,0.7)",
                        }}
                        placeholder="Describe symptoms (e.g., headache for 2 days)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        disabled={isThinking}
                    />
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => send()}
                        disabled={!input.trim()}
                        className="p-2.5 rounded-xl text-white focus:outline-none flex-shrink-0 disabled:opacity-40 transition-opacity"
                        style={{
                            background:
                                "linear-gradient(135deg, #0a5bbf, #127fec)",
                            boxShadow: "0 2px 12px rgba(18,127,236,0.35)",
                        }}
                    >
                        <Send size={16} />
                    </motion.button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2 mb-0.5 leading-relaxed">
                    AI provides general guidance only and do not provide any
                    medical diagnosis.
                </p>
            </div>
        </motion.aside>
    );
}
