import { motion } from "framer-motion";
import {
    CalendarClock,
    Mail,
    ShieldCheck,
    UserRound,
    Hash,
} from "lucide-react";
import authService from "../api/authService";
import { ROLES } from "../config/roles";

const formatDate = (dateString) => {
    if (!dateString) {
        return "Not available";
    }

    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
        return "Not available";
    }

    return parsed.toLocaleString();
};

const normalizeAdminRole = (adminRole) => {
    const value = String(adminRole || "")
        .trim()
        .toLowerCase();

    if (["super", "super admin", "super-admin", "super_admin"].includes(value)) {
        return "super";
    }

    if (value === "manager") {
        return "manager";
    }

    if (value === "hr") {
        return "hr";
    }

    return "unknown";
};

const resolveDisplayRole = (user) => {
    if (!user || user.role !== "admin") {
        return ROLES[user?.role]?.label || "Patient";
    }

    const normalizedAdminRole = normalizeAdminRole(user.admin_role);

    if (normalizedAdminRole === "super") {
        return "Super Admin";
    }

    if (normalizedAdminRole === "manager") {
        return "Manager";
    }

    if (normalizedAdminRole === "hr") {
        return "HR";
    }

    return "Admin";
};

const resolveIdLabel = (role) => {
    if (role === "admin") {
        return "Admin ID";
    }

    if (role === "doctor") {
        return "Doctor ID";
    }

    return "Patient ID";
};

export default function ProfilePage() {
    const user = authService.getCurrentUser();
    const role = user?.role || "patient";
    const cfg = ROLES[role] || ROLES.patient;
    const displayRole = resolveDisplayRole(user);

    if (!user) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">
                    No user session found. Please sign in again.
                </div>
            </div>
        );
    }

    const initials =
        user.name
            ?.split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "U";

    const userItems = [
        {
            icon: <UserRound size={18} />,
            label: "Full Name",
            value: user.name || "Not available",
        },
        {
            icon: <Mail size={18} />,
            label: "Email",
            value: user.email || "Not available",
        },
        {
            icon: <ShieldCheck size={18} />,
            label: "Role",
            value: displayRole,
        },
        {
            icon: <Hash size={18} />,
            label: resolveIdLabel(role),
            value: user.id ? `#${user.id}` : "Not available",
        },
        {
            icon: <CalendarClock size={18} />,
            label: "Account Created",
            value: formatDate(user.created_at),
        },
    ];

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(125deg, ${cfg.accentLight} 0%, #ffffff 58%)`,
                    }}
                />

                <div className="relative px-7 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-7">
                    <div className="flex items-center gap-5">
                        <div
                            className="h-20 w-20 md:h-24 md:w-24 rounded-3xl flex items-center justify-center text-2xl md:text-3xl font-black shadow-sm"
                            style={{
                                background: "white",
                                color: cfg.accent,
                                border: `1px solid ${cfg.accent}30`,
                            }}
                        >
                            {initials}
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                {cfg.label} Portal Profile
                            </p>
                            <h1 className="text-3xl font-black text-slate-900 leading-tight">
                                {user.name}
                            </h1>
                            <div className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                                style={{
                                    color: cfg.accentDark,
                                    background: cfg.accentLight,
                                    border: `1px solid ${cfg.accent}40`,
                                }}
                            >
                                {displayRole}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-600 max-w-xs">
                        This profile reflects your authenticated session data from the API.
                    </div>
                </div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="grid lg:grid-cols-5 gap-5"
            >
                <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">User Data</h2>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {userItems.map((item) => (
                            <div key={item.label} className="px-6 py-4 flex items-start gap-3">
                                <div
                                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                                    style={{
                                        background: cfg.accentLight,
                                        color: cfg.accent,
                                    }}
                                >
                                    {item.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                        {item.label}
                                    </p>
                                    <p className="text-sm md:text-base text-slate-800 font-medium break-words mt-0.5">
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                        <h3 className="text-base font-bold text-slate-800 mb-2">Session Status</h3>
                        <p className="text-sm text-slate-600">
                            You are currently authenticated. Protected routes are enabled for this account.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                        <h3 className="text-base font-bold text-slate-800 mb-2">Security</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>Password is hidden from responses.</li>
                            <li>Role-based dashboard access is enforced.</li>
                            <li>JWT token is required for protected APIs.</li>
                        </ul>
                    </div>
                </div>
            </motion.section>
        </div>
    );
}
