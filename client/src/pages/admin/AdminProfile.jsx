import { useState } from "react";
import { motion } from "framer-motion";
import { User, Briefcase } from "lucide-react";

export default function AdminProfile() {
  const [isEdit, setIsEdit] = useState(false);

  // Sample data
  const [profile, setProfile] = useState({
    name: "Alexander Pierce",
    phone: "+880123-4567",
    email: "alexander.pierce@pulseportal.com",
    role: "Super Admin",
    department: "All Departments / System Wide",
    lastLogin: "Today, 08:45 AM ",
  });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const firstChar = profile.name.charAt(0).toUpperCase();

  return (
    <div className="px-6 lg:px-12 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-md p-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-5">
          {/* Profile Picture */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-700"
          >
            {firstChar || <User size={40} />}
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
            <span className="text-xs bg-slate-800 text-white px-3 py-1 rounded-full uppercase tracking-wider">
              {profile.role}
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsEdit(!isEdit)}
          className="px-5 py-2 rounded-full text-white text-sm font-semibold shadow"
          style={{ background: "linear-gradient(135deg, #0a5bbf, #127fec)" }}
        >
          {isEdit ? "Cancel" : "Edit Profile"}
        </motion.button>
      </motion.div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02, boxShadow: "0 15px 25px rgba(0,0,0,0.15)" }}
          className="bg-white p-8 rounded-2xl shadow-md transition-shadow duration-300 space-y-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-slate-700" />
            <h3 className="font-bold text-slate-700 text-lg">Personal Information</h3>
          </div>

          <div className="space-y-6 text-slate-600">
            <div>
              <p className="text-xs font-semibold uppercase">Full Name</p>
              {isEdit ? (
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="border px-3 py-2 rounded w-full text-sm text-black"
                />
              ) : (
                <p className="text-base mt-1 text-black">{profile.name}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase">Phone Number</p>
              {isEdit ? (
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="border px-3 py-2 rounded w-full text-sm text-black"
                />
              ) : (
                <p className="text-base mt-1 text-black">{profile.phone}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase">Email Address</p>
              {isEdit ? (
                <input
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="border px-3 py-2 rounded w-full text-sm text-black"
                />
              ) : (
                <p className="text-base mt-1 text-black">{profile.email}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Role Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02, boxShadow: "0 15px 25px rgba(0,0,0,0.15)" }}
          className="bg-white p-8 rounded-2xl shadow-md transition-shadow duration-300 space-y-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={20} className="text-slate-700" />
            <h3 className="font-bold text-slate-700 text-lg">Role Information</h3>
          </div>

          <div className="space-y-6 text-slate-600">
            <div>
              <p className="text-xs font-semibold uppercase">Admin Role</p>
              {isEdit ? (
                <input
                  name="role"
                  value={profile.role}
                  onChange={handleChange}
                  className="border px-3 py-2 rounded w-full text-sm text-black"
                />
              ) : (
                <p className="text-base mt-1 text-black">{profile.role}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase">Assigned Department</p>
              {isEdit ? (
                <input
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  className="border px-3 py-2 rounded w-full text-sm text-black"
                />
              ) : (
                <p className="text-base mt-1 text-black">{profile.department}</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase">Last Login</p>
              <p className="text-base mt-1 text-black">{profile.lastLogin}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      {isEdit && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setIsEdit(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold shadow hover:bg-blue-700 transition-colors duration-300"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}