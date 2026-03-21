import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Edit,
} from "lucide-react";

export default function DoctorProfile() {
    const [isEdit, setIsEdit] = useState(false);

    const [profile, setProfile] = useState({
        name: "Dr. Emily Stone",
        specialization: "Cardiology",
        license: "MD-123456789",
        email: "emily@pulseportal.med",
        phone: "+88012360-4567",
        location: "Cardiology Dept, Wing B, Floor 3",
        bio: "Dr. Emily Stone is a board-certified cardiologist with over 15 years of experience in diagnosing and treating cardiovascular diseases.",
        days: "Monday - Friday",
        time: "09:00 AM - 05:00 PM",
    });

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const toggleEdit = () => {
        setIsEdit(!isEdit);
        
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto px-6 py-10"
        >
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between bg-white rounded-2xl shadow p-6 mb-8"
            >
                <div className="flex items-center gap-5">
                    {/* Default Avatar */}
                    <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                            {profile.name.charAt(0)}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        {isEdit ? (
                            <input
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                className="text-xl font-bold border px-2 py-1 rounded w-[180px] mb-2"
                            />
                        ) : (
                            <h2 className="text-xl font-bold">
                                {profile.name}
                            </h2>
                        )}

                        {isEdit ? (
                            <input
                                name="specialization"
                                value={profile.specialization}
                                onChange={handleChange}
                                className="text-blue-500 text-sm border px-2 py-1 rounded w-[160px]"
                            />
                        ) : (
                            <span className="text-blue-500 text-sm font-medium">
                                {profile.specialization}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={toggleEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                >
                    <Edit size={16} />
                    {isEdit ? "Save" : "Edit Profile"}
                </button>
            </motion.div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Professional Info */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow p-6"
                >
                    <h3 className="font-semibold mb-4 text-lg">
                        Professional Information
                    </h3>

                    <EditableField
                        label="Name"
                        name="name"
                        value={profile.name}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />

                    <EditableField
                        label="Specialization"
                        name="specialization"
                        value={profile.specialization}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />

                    <EditableField
                        label="License Number"
                        name="license"
                        value={profile.license}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />
                </motion.div>

                {/* Availability */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow p-6"
                >
                    <h3 className="font-semibold mb-4 text-lg">Availability</h3>

                    <EditableIconField
                        icon={<Calendar size={18} />}
                        label="Working Days"
                        name="days"
                        value={profile.days}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />

                    <EditableIconField
                        icon={<Clock size={18} />}
                        label="Time Slots"
                        name="time"
                        value={profile.time}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />
                </motion.div>

                {/* Bio */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow p-6"
                >
                    <h3 className="font-semibold mb-4 text-lg">
                        Professional Bio
                    </h3>

                    {isEdit ? (
                        <textarea
                            name="bio"
                            value={profile.bio}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                        />
                    ) : (
                        <p className="text-slate-600">{profile.bio}</p>
                    )}
                </motion.div>

                {/* Contact */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow p-6"
                >
                    <h3 className="font-semibold mb-4 text-lg">
                        Contact Information
                    </h3>

                    <EditableIconField
                        icon={<Mail size={18} />}
                        label="Email"
                        name="email"
                        value={profile.email}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />

                    <EditableIconField
                        icon={<Phone size={18} />}
                        label="Phone"
                        name="phone"
                        value={profile.phone}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />

                    <EditableIconField
                        icon={<MapPin size={18} />}
                        label="Office Location"
                        name="location"
                        value={profile.location}
                        isEdit={isEdit}
                        handleChange={handleChange}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
}

/* Reusable Editable Field */
function EditableField({ label, name, value, isEdit, handleChange }) {
    return (
        <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-500">{label}</span>
            {isEdit ? (
                <input
                    name={name}
                    value={value}
                    onChange={handleChange}
                    className="border px-2 py-1 rounded"
                />
            ) : (
                
                <span className="font-medium">{value}</span>
            )}
        </div>
    );
}

/* Reusable Editable Icon Field */
function EditableIconField({
    icon,
    label,
    name,
    value,
    isEdit,
    handleChange,
}) {
    return (
        
        <div className="flex items-center gap-3 text-sm mb-3">
            <div className="text-blue-500">{icon}</div>
            <div className="flex justify-between w-full">
                <span className="text-slate-500">{label}</span>
                {isEdit ? (
                    <input
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="border px-2 py-1 rounded"
                    />
                ) : (
                    <span className="font-medium">{value}</span>
                )}
            </div>
        </div>
    );
}