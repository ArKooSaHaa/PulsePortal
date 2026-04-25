import { useState, useRef, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
    X,
    Send,
    Bot,
    AlertTriangle,
    CalendarPlus,
    Stethoscope,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import aiService from "../api/aiService";

const CHIPS = [
    "Headache",
    "Fever",
    "Chest Pain",
    "Skin Issue",
    "General Checkup",
];

const STAGE_LABELS = {
    collect: "Step 1: Symptom Collection",
    confirm: "Step 2: Confirmation",
    advice: "Step 3: Care Plan & Doctors",
};

const ADVICE_HEADING_MAP = {
    "likely possibilities": "likely",
    "care plan": "care",
    "medicine options (otc only)": "medicine",
    "when to seek urgent care": "urgent",
    "recommended specialist": "specialist",
};

const ADVICE_SECTION_META = {
    likely: {
        title: "Likely Possibilities",
        panelClass: "border-slate-200 bg-slate-50/75",
        titleClass: "text-slate-700",
    },
    care: {
        title: "Care Plan",
        panelClass: "border-cyan-200 bg-cyan-50/75",
        titleClass: "text-cyan-700",
    },
    urgent: {
        title: "When To Seek Urgent Care",
        panelClass: "border-rose-200 bg-rose-50/80",
        titleClass: "text-rose-700",
    },
    specialist: {
        title: "Recommended Specialist",
        panelClass: "border-emerald-200 bg-emerald-50/75",
        titleClass: "text-emerald-700",
    },
};

function parseAdviceSections(text) {
    const sections = {
        likely: [],
        care: [],
        medicine: [],
        urgent: [],
        specialist: [],
    };

    const lines = String(text || "").split("\n");
    let currentSection = null;

    lines.forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line) {
            return;
        }

        const normalizedHeading = line
            .toLowerCase()
            .replace(/\*+/g, "")
            .replace(/:+$/, "")
            .trim();

        if (ADVICE_HEADING_MAP[normalizedHeading]) {
            currentSection = ADVICE_HEADING_MAP[normalizedHeading];
            return;
        }

        if (!currentSection) {
            return;
        }

        const bullet = line.match(/^[-•*]\s+(.*)$/) || line.match(/^\d+\.\s+(.*)$/);
        const content = (bullet ? bullet[1] : line).trim();
        if (content) {
            sections[currentSection].push(content);
        }
    });

    const hasStructuredContent = Object.values(sections).some(
        (items) => Array.isArray(items) && items.length > 0,
    );

    return hasStructuredContent ? sections : null;
}

function buildMedicineRows(items) {
    return items
        .map((entry) => {
            const cleaned = String(entry || "").replace(/\s+/g, " ").trim();
            if (!cleaned) {
                return null;
            }

            if (/^(avoid|do not|don't)/i.test(cleaned)) {
                return {
                    medicine: "Safety note",
                    usage: cleaned,
                };
            }

            const splitByAsPer = cleaned.match(/^(.*?)\s+as\s+per\s+(.+)$/i);
            if (splitByAsPer) {
                return {
                    medicine: splitByAsPer[1].trim(),
                    usage: `Use as per ${splitByAsPer[2].trim()}`,
                };
            }

            const splitByDash = cleaned.split(/\s+[—-]\s+/);
            if (splitByDash.length >= 2) {
                return {
                    medicine: splitByDash[0].trim(),
                    usage: splitByDash.slice(1).join(" - ").trim(),
                };
            }

            const splitByColon = cleaned.split(/:\s+/);
            if (splitByColon.length >= 2) {
                return {
                    medicine: splitByColon[0].trim(),
                    usage: splitByColon.slice(1).join(": ").trim(),
                };
            }

            return {
                medicine: cleaned,
                usage: "Follow package instructions and pharmacist guidance.",
            };
        })
        .filter(Boolean);
}

function AdviceListSection({ sectionKey, items }) {
    if (!items?.length) {
        return null;
    }

    const meta = ADVICE_SECTION_META[sectionKey];
    if (!meta) {
        return null;
    }

    return (
        <div className={`rounded-xl border px-3 py-2.5 ${meta.panelClass}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wide ${meta.titleClass}`}>
                {meta.title}
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-700">
                {items.map((item, idx) => (
                    <li key={`${sectionKey}-${idx}`}>{item}</li>
                ))}
            </ul>
        </div>
    );
}

function MedicineTableSection({ items }) {
    if (!items?.length) {
        return null;
    }

    const rows = buildMedicineRows(items);
    if (!rows.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-blue-200/80 overflow-hidden bg-white/85 shadow-[0_6px_18px_rgba(18,127,236,0.08)]">
            <div className="px-3 py-2 bg-gradient-to-r from-[#0a5bbf] to-[#127fec]">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white">
                    Medicine Options (OTC)
                </p>
            </div>

            <div className="grid grid-cols-12 border-b border-blue-100 bg-blue-50/70 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                <p className="col-span-5 px-3 py-2">Medicine</p>
                <p className="col-span-7 px-3 py-2">How To Use</p>
            </div>

            {rows.map((row, idx) => (
                <div
                    key={`medicine-row-${idx}`}
                    className={`grid grid-cols-12 text-xs ${idx !== rows.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                    <p className="col-span-5 px-3 py-2.5 font-semibold text-slate-700 break-words">
                        {row.medicine}
                    </p>
                    <p className="col-span-7 px-3 py-2.5 text-slate-600 leading-relaxed break-words">
                        {row.usage}
                    </p>
                </div>
            ))}
        </div>
    );
}

function AdviceMessage({ sections }) {
    return (
        <div className="flex flex-col gap-2.5">
            <AdviceListSection sectionKey="likely" items={sections.likely} />
            <AdviceListSection sectionKey="care" items={sections.care} />
            <MedicineTableSection items={sections.medicine} />
            <AdviceListSection sectionKey="urgent" items={sections.urgent} />
            <AdviceListSection sectionKey="specialist" items={sections.specialist} />
        </div>
    );
}

/* floating orb  */
function Orb({ size, color, x, y, duration, delay }) {
    return (
        <Motion.div
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
                    <Motion.span
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

function DoctorRecommendations({ doctors, symptoms, onBook }) {
    if (!Array.isArray(doctors) || doctors.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 pt-3 border-t border-blue-100/70 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#127fec]">
                <Stethoscope size={12} />
                Recommended Doctors
            </div>
            {doctors.slice(0, 4).map((doctor) => (
                <div
                    key={doctor.id}
                    className="rounded-xl border border-slate-100 bg-white/70 px-3 py-2"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                                {doctor.name}
                            </p>
                            <p className="text-xs text-slate-500">
                                {doctor.specialization}
                                {doctor.fee ? ` · ৳${doctor.fee}` : ""}
                            </p>
                            {doctor.service_hours_label && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {doctor.service_hours_label}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => onBook(doctor, symptoms)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#127fec] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0a5bbf] transition-colors flex-shrink-0"
                        >
                            <CalendarPlus size={12} />
                            Book Appointment
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AIChatPanel({ onClose }) {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            id: 0,
            from: "ai",
            text: "Hi! I'm your AI Health Assistant. I will first collect your symptom details, then confirm them with you, and finally share guidance, basic medicine options, and suitable doctors from PulsePortal. What symptoms are you facing right now?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [showChips, setShowChips] = useState(true);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    /**
     * Build conversation history in the format the backend expects.
     * Excludes the initial greeting and the current user message.
     */
    function buildHistory() {
        return messages
            .filter((m) => m.id !== 0) // skip initial greeting
            .map((m) => ({
                role: m.from === "user" ? "user" : "assistant",
                content: m.text,
            }));
    }

    async function send(text) {
        const trimmed = (text ?? input).trim();
        if (!trimmed || isThinking) return;

        const userMsg = { id: Date.now(), from: "user", text: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setShowChips(false);
        setError(null);
        setIsThinking(true);

        try {
            const history = buildHistory();
            const aiResponse = await aiService.chatWithAssistant(trimmed, history);
            const responseText = aiResponse.message || String(aiResponse || "");

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    from: "ai",
                    text: responseText,
                    stage: aiResponse.stage || "",
                    doctors: aiResponse.doctors || [],
                    specialization: aiResponse.specialization || "",
                    disclaimer: aiResponse.disclaimer || "",
                    emergency: Boolean(aiResponse.emergency),
                    symptoms: aiResponse.symptom_summary || trimmed,
                },
            ]);
        } catch (err) {
            console.error("AI chat error:", err);
            const backendMsg = err.response?.data?.message;
            setError(backendMsg || "Failed to get a response. Please try again.");
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    from: "ai",
                    text: backendMsg || "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                },
            ]);
        } finally {
            setIsThinking(false);
        }
    }

    /**
     * Render message text with basic markdown-like formatting.
     * Handles **bold**, line breaks, and bullet points.
     */
    function renderMessageText(text) {
        // Split by double newlines for paragraphs, then handle bullets
        const lines = String(text || "").split('\n');
        const elements = [];
        let currentList = [];

        const flushList = () => {
            if (currentList.length > 0) {
                elements.push(
                    <ul key={`list-${elements.length}`} className="list-disc pl-4 space-y-0.5 my-1">
                        {currentList.map((item, i) => (
                            <li key={i} className="text-sm leading-relaxed">{formatInline(item)}</li>
                        ))}
                    </ul>
                );
                currentList = [];
            }
        };

        lines.forEach((line, i) => {
            const trimmedLine = line.trim();
            // Bullet point lines
            if (/^[-•*]\s+/.test(trimmedLine)) {
                currentList.push(trimmedLine.replace(/^[-•*]\s+/, ''));
            } else if (/^\d+\.\s+/.test(trimmedLine)) {
                currentList.push(trimmedLine.replace(/^\d+\.\s+/, ''));
            } else {
                flushList();
                if (trimmedLine === '') {
                    // Empty line = paragraph break
                    if (i > 0 && i < lines.length - 1) {
                        elements.push(<div key={`br-${i}`} className="h-2" />);
                    }
                } else {
                    elements.push(
                        <p key={`p-${i}`} className="text-sm leading-relaxed">
                            {formatInline(trimmedLine)}
                        </p>
                    );
                }
            }
        });
        flushList();

        return <div className="flex flex-col gap-0.5">{elements}</div>;
    }

    function formatInline(text) {
        // Handle **bold** text
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    }

    function bookDoctor(doctor, symptoms) {
        navigate("/patient/book-appointment", {
            state: {
                doctorId: doctor.id,
                specialization: doctor.specialization,
                symptoms,
            },
        });
        onClose?.();
    }

    return (
        <Motion.aside
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
                <Motion.div
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
                    <Motion.div
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
                    </Motion.div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">
                            AI Health Assistant
                        </p>
                        <p className="text-white/70 text-[11px] mt-0.5">
                            Collect symptoms, confirm details, then get care plan.
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
                    {messages.map((msg) => {
                        const adviceSections =
                            msg.stage === "advice"
                                ? parseAdviceSections(msg.text)
                                : null;

                        return (
                            <Motion.div
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
                                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl leading-relaxed ${
                                        msg.from === "user"
                                            ? "bg-[#127fec] text-white text-sm rounded-br-sm shadow-md"
                                            : "rounded-bl-sm shadow-sm"
                                    }`}
                                    style={
                                        msg.from === "ai"
                                            ? {
                                                  background:
                                                      "rgba(255,255,255,0.72)",
                                                  backdropFilter:
                                                      "blur(16px)",
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
                                    {msg.from === "ai" ? (
                                        <>
                                            {msg.stage && STAGE_LABELS[msg.stage] && (
                                                <p className="mb-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#127fec]">
                                                    {STAGE_LABELS[msg.stage]}
                                                </p>
                                            )}
                                            {adviceSections ? (
                                                <AdviceMessage sections={adviceSections} />
                                            ) : (
                                                renderMessageText(msg.text)
                                            )}
                                            {msg.stage === "confirm" &&
                                                !msg.emergency && (
                                                    <div className="mt-3 pt-3 border-t border-blue-100/70">
                                                        <button
                                                            onClick={() =>
                                                                send("confirm")
                                                            }
                                                            disabled={
                                                                isThinking
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#127fec] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0a5bbf] transition-colors disabled:opacity-50"
                                                        >
                                                            Confirm Details
                                                        </button>
                                                    </div>
                                                )}
                                            {!msg.emergency && (
                                                <DoctorRecommendations
                                                    doctors={msg.doctors}
                                                    symptoms={msg.symptoms}
                                                    onBook={bookDoctor}
                                                />
                                            )}
                                            {msg.disclaimer && (
                                                <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] leading-relaxed text-slate-400">
                                                    {msg.disclaimer}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </Motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Suggestion chips */}
                <AnimatePresence>
                    {showChips && (
                        <Motion.div
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
                        </Motion.div>
                    )}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                    {isThinking && (
                        <Motion.div
                            key="typing"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10"
                        >
                            <TypingIndicator />
                        </Motion.div>
                    )}
                </AnimatePresence>

                {/* Error banner */}
                <AnimatePresence>
                    {error && (
                        <Motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50/80 border border-red-100 text-red-600 text-xs"
                        >
                            <AlertTriangle size={12} />
                            {error}
                        </Motion.div>
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
                        placeholder="Describe symptoms + duration + severity"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        disabled={isThinking}
                    />
                    <Motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => send()}
                        disabled={!input.trim() || isThinking}
                        className="p-2.5 rounded-xl text-white focus:outline-none flex-shrink-0 disabled:opacity-40 transition-opacity"
                        style={{
                            background:
                                "linear-gradient(135deg, #0a5bbf, #127fec)",
                            boxShadow: "0 2px 12px rgba(18,127,236,0.35)",
                        }}
                    >
                        <Send size={16} />
                    </Motion.button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2 mb-0.5 leading-relaxed">
                    AI provides general guidance only and does not provide a final medical diagnosis.
                </p>
            </div>
        </Motion.aside>
    );
}
