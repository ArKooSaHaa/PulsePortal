import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, X } from "lucide-react";

export default function AIChatPanel({ onClose }) {
    const [messages, setMessages] = useState([
        {
            from: "ai",
            text: "Hi! I'm your AI Health Assistant. How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");

    function send() {
        const trimmed = input.trim();
        if (!trimmed) return;
        setMessages((prev) => [
            ...prev,
            { from: "user", text: trimmed },
        ]);
        setInput("");
    }

    return (
        <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 h-full w-full max-w-[550px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
        >
            <div
                className="flex items-center justify-between px-5 py-4 border-b border-slate-100"
                style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">
                            AI Health Assistant
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === "user" ? "bg-[#127fec] text-white rounded-br-sm" : "bg-slate-100 text-slate-700 rounded-bl-sm"}`} >
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
                <input
                    className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#127fec]/30 placeholder:text-slate-400"
                    placeholder="Ask about symptoms, specialists, or appointments..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={send} className="p-2.5 rounded-xl text-white focus:outline-none" style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}>
                    <Send size={17} />
                </motion.button>
            </div>
        </motion.aside>
    );
}
