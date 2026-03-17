import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, Briefcase, Eye, EyeOff, Plus } from "lucide-react";

export default function AddAdmin() {
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(form);
        // ekhane API call kora jabe
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto px-4 py-12"
        >
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 80 }}
                className="bg-white rounded-2xl shadow-lg p-8"
            >
                <h2 className="text-2xl font-bold mb-2">Register New Admin</h2>
                <p className="text-slate-500 mb-8">
                    Grant system-wide administrative privileges to a new team member.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-black mb-1">Full Name</label>
                            <Input
                                icon={<User size={16} />}
                                placeholder="e.g. Sarah "
                                name="name"
                                onChange={handleChange}
                            />
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className="block text-black mb-1">Email Address</label>
                            <Input
                                icon={<Mail size={16} />}
                                placeholder="sarah@pulseportal.med"
                                name="email"
                                onChange={handleChange}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-black mb-1">Password</label>
                            <div className="relative">
                                <Input
                                    icon={<Lock size={18} />}
                                    type={showPass ? "text" : "password"}
                                    placeholder="••••••••"
                                    name="password"
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-3 text-slate-500"
                                >
                                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-black mb-1">Phone Number</label>
                            <Input
                                icon={<Phone size={16} />}
                                placeholder="+8801700-0000"
                                name="phone"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div className="mt-6">
                        <label className="block text-black mb-1">Role</label>
                        <div className="relative">
                            <Briefcase
                                size={16}
                                className="absolute left-3 top-3 text-slate-400"
                            />
                            <select
                                name="role"
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-slate-600"
                            >
                                <option>Select a role</option>
                                <option>Super Admin</option>
                                <option>Manager</option>
                                <option>HR</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        // className="w-full mt-6 py-2.5 rounded-full text-white font-semibold shadow-md flex items-center justify-center gap-2"
                            className="w-auto mx-auto mt-6 py-2.5 px-5 rounded-full text-white text-sm font-semibold shadow-md flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
                    >
                        <Plus size={18} /> Create Admin Account
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
}

function Input({ icon, ...props }) {
    return (
        <div className="relative">
            <div className="absolute left-3 top-3 text-slate-400">{icon}</div>
            <input
                {...props}
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
        </div>
    );
}