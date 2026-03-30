import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Briefcase, Upload, Camera } from "lucide-react";
import api from "../../api/axios";

export default function AddDoctor() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        department: "Cardiology",
        specialization: "",
        license: "",
        days: [],
        photo: null,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const daysList = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const toggleDay = (day) => {
        setForm((prev) => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter((d) => d !== day)
                : [...prev.days, day],
        }));
    };

    const handlePhoto = (e) => {
        setForm({ ...form, photo: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.name.trim()) {
            setError("Full name is required.");
            return;
        }
        if (!form.email.trim()) {
            setError("Email is required.");
            return;
        }
        if (!form.password) {
            setError("Password is required.");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append("name", form.name.trim());
            data.append("email", form.email.trim().toLowerCase());
            data.append("password", form.password);
            if (form.phone?.trim()) data.append("phone", form.phone.trim());
            if (form.department) data.append("department", form.department);
            if (form.specialization?.trim())
                data.append("specialization", form.specialization.trim());
            if (form.license?.trim())
                data.append("license_number", form.license.trim());
            form.days.forEach((day) => data.append("available_days[]", day));
            if (form.photo) data.append("photo", form.photo);

            await api.post("/admin/doctors", data);

            setSuccess("Doctor account created successfully.");
            setForm({
                name: "",
                email: "",
                password: "",
                phone: "",
                department: "Cardiology",
                specialization: "",
                license: "",
                days: [],
                photo: null,
            });
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (err.response?.data?.errors
                    ? Object.values(err.response.data.errors)[0][0]
                    : "Failed to create doctor. Please try again.");
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div className="max-w-6xl mx-auto px-6 py-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-1">Register New Doctor</h2>
                <p className="text-slate-500 mb-6">Create a professional profile and credentials for a new practitioner.</p>

                {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                {success && (
                    <p className="text-green-700 text-sm mb-4">{success}</p>
                )}

                
       {/* PHOTO UPLOAD */}
            <div className="flex items-center gap-4 mb-6">
  
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center  relative">
    

    
          <label className="absolute bottom-0 right-0 translate-x-1/4 bg-blue-500 text-white p-2 rounded-full cursor-pointer shadow-md boarder-2  border-white">
         <Camera size={18} />
         <input
         type="file"
         accept="image/*"
         onChange={handlePhoto}
         className="hidden"
         />
        </label>
       </div>

  {/* Text section */}
  <div>
    <p className="font-semibold">Doctor Photo</p>
    <p className="text-sm text-gray-500">
    
      Professional headshots recommended (400x400px)</p>
     <label className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg cursor-pointer text-sm">
      <Upload size={16} />
      Upload New Image
      <input
        type="file"
        accept="image/*"
        onChange={handlePhoto}
        className="hidden"
      />
    </label>
    </div>
    </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-8">

                        {/* LEFT */}
                        <div>
                            <SectionTitle icon={<User size={18} />} title="Personal Information" />

                            <Input label="Full Name" name="name" value={form.name} onChange={handleChange} />
                            <Input label="Email" name="email" value={form.email} onChange={handleChange} />
                            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} />
                            <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                        </div>

                        {/* RIGHT */}
                        <div>
                            <SectionTitle icon={<Briefcase size={18} />} title="Professional Details" />

                            <Select name="department" value={form.department} onChange={handleChange} />
                            <Input label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} />
                            <Input label="License Number" name="license" value={form.license} onChange={handleChange} />

                            {/* AVAILABLE DAYS */}
                            <div className="mt-4">
                                <p className="text-sm mb-2">Available Days</p>
                                <div className="flex flex-wrap gap-2">
                                    {daysList.map((day) => (
                                        <motion.button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                                                form.days.includes(day)
                                                    ? "bg-blue-500 text-white border-blue-500"
                                                    : "text-slate-600 border-gray-300"
                                            }`}
                                        >
                                            {day}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-10">
                        <motion.button
    type="submit"
    disabled={loading}
    className="px-6 py-2 rounded-full text-white"
    style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
>
    {loading ? "Creating..." : "Create Doctor Account"}
</motion.button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}

/* Components */

function Input({ label, ...props }) {
    return (
        <div className="mb-4">
            <p className="text-sm mb-1">{label}</p>
            <input
                {...props}
                className="w-full px-4 py-2 rounded-xl border"
            />
        </div>
    );
}

function Select(props) {
    return (
        <div className="mb-4">
            <p className="text-sm mb-1">Department</p>
            <select {...props} className="w-full px-4 py-2 rounded-xl border">
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
            </select>
        </div>
    );
}

function SectionTitle({ icon, title }) {
    return (
        <div className="flex items-center gap-2 mb-4 mt-2">
            <div className="text-blue-500">{icon}</div>
            <h3 className="font-semibold">{title}</h3>
        </div>
    );
}