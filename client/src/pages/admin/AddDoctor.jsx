import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Briefcase, Upload, Camera } from "lucide-react";

export default function AddDoctor() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        department: "",
        specialization: "",
        license: "",
        days: [],
        photo: null,
    });

    const daysList = ["SUN","MON", "TUE", "WED", "THU", "FRI", "SAT"];

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

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(form);
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

                            <Input label="Full Name" name="name" onChange={handleChange} />
                            <Input label="Email" name="email" onChange={handleChange} />
                            <Input label="Password" type="password" name="password" onChange={handleChange} />
                            <Input label="Phone" name="phone" onChange={handleChange} />
                        </div>

                        {/* RIGHT */}
                        <div>
                            <SectionTitle icon={<Briefcase size={18} />} title="Professional Details" />

                            <Select name="department" onChange={handleChange} />
                            <Input label="Specialization" name="specialization" onChange={handleChange} />
                            <Input label="License Number" name="license" onChange={handleChange} />

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
    className="px-6 py-2 rounded-full text-white"
    style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
>
    Create Doctor Account
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
                <option>Cardiology</option>
                <option>Neurology</option>
                <option>Orthopedics</option>
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