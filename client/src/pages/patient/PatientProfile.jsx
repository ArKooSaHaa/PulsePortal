import React from "react";
import { motion } from "framer-motion";
import {
    Mail,
    Edit2,
    User,
    Phone,
    BriefcaseMedical,
    IdCard,
    Pencil,
} from "lucide-react";

function InfoField({ label, value }) {
    return (
        <div className="flex justify-between items-center text-[13px]">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-base font-semibold text-slate-800">{value}</p>
        </div>
    );
}

export default function PatientProfile() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-4 py-10"
        >
            {/* header card */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-[2rem] shadow-sm border border-slate-100 px-12 py-8 mb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6"
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="h-[120px] w-[120px] rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-100">
                            <img
                                src="https://placehold.co/600x400"
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="absolute bottom-0 flex items-center justify-center right-0 h-10 w-10 bg-blue-500 border-white border-2 rounded-full">
                            <Pencil size={16} className="text-white" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-3 mb-3">
                            <input
                                name="name"
                                value="hrittika"
                                className="text-[28px] font-bold text-slate-800 tracking-tight border-b-2 border-blue-500 focus:outline-none bg-slate-50 px-2 rounded-t-md"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 mb-3 text-md font-medium">
                            <Mail size={16} />
                            <span>patient@gmail.com</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-pink-50 text-pink-500 text-xs font-semibold rounded-full border border-pink-100">
                                B+ Blood
                            </span>
                        </div>
                    </div>
                </div>
                <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#3b82f6] text-white font-semibold text-sm hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20 mt-2 md:mt-4"
                >
                    <Edit2 size={16}  className="text-white" />
                    Edit Profile
                </motion.button>
            </motion.div>

            {/* making a grid for informations */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                            <User size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">
                            Personal Information
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <InfoField label="Full Name" value="Hrittika Saha" />
                        <hr className="border-slate-50" />
                        <InfoField label="Date of Birth" value="—" />
                    </div>
                </motion.div>

                {/* Contact Information */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                            <Phone size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                            Contact Information
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <InfoField label="Phone" value="—" />
                        <hr className="border-slate-50" />
                        <InfoField label="Address" value="—" />
                        <hr className="border-slate-50" />
                        <InfoField label="Emergency Contact" value="—" />
                    </div>
                </motion.div>

                {/* Health Information */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                            <BriefcaseMedical size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                            Health Information
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <InfoField label="Blood Group" value="—" />
                        <hr className="border-slate-50" />
                        <InfoField label="Medical History" value="—" />
                    </div>
                </motion.div>

                {/* Account Information */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-full">
                            <IdCard size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                            Account Information
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <InfoField label="Email" value="patient@gmail.com" />
                        <hr className="border-slate-50" />
                        <InfoField label="Member Since" value="—" />
                        <hr className="border-slate-50" />
                        <InfoField label="Password" value="••••••••" />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
