const USERS_KEY = 'pulseportal_users';
const SESSION_USER_KEY = 'user';

const DEFAULT_USERS = [
    {
        id: 'seed-patient',
        name: 'Patient User',
        email: 'patient@pulseportal.com',
        password: 'password123',
        role: 'patient',
    },
    {
        id: 'seed-doctor',
        name: 'Doctor User',
        email: 'doctor@pulseportal.com',
        password: 'password123',
        role: 'doctor',
    },
    {
        id: 'seed-admin',
        name: 'Admin User',
        email: 'admin@pulseportal.com',
        password: 'password123',
        role: 'admin',
    },
];

const readUsers = () => {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }

    try {
        const users = JSON.parse(raw);
        return Array.isArray(users) ? users : DEFAULT_USERS;
    } catch {
        localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
    }
};

const writeUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const saveSessionUser = (user) => {
    const { password, ...safeUser } = user;
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
};

const authService = {
    register: async (name, email, password, role = 'patient') => {
        const users = readUsers();
        const normalizedEmail = email.trim().toLowerCase();

        if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
            const error = new Error('This email is already registered.');
            error.response = { data: { message: 'This email is already registered.' } };
            throw error;
        }

        const newUser = {
            id: `user-${Date.now()}`,
            name: name.trim(),
            email: normalizedEmail,
            password,
            role,
        };

        users.push(newUser);
        writeUsers(users);
        return saveSessionUser(newUser);
    },

    login: async (email, password) => {
        const users = readUsers();
        const normalizedEmail = email.trim().toLowerCase();
        const found = users.find(
            (u) => u.email.toLowerCase() === normalizedEmail && u.password === password,
        );

        if (!found) {
            const error = new Error('Invalid email or password');
            error.response = { data: { message: 'Invalid email or password' } };
            throw error;
        }

        return saveSessionUser(found);
    },

    logout: async () => {
        localStorage.removeItem(SESSION_USER_KEY);
    },

    getCurrentUser: () => {
        const raw = localStorage.getItem(SESSION_USER_KEY);
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch {
            localStorage.removeItem(SESSION_USER_KEY);
            return null;
        }
    },

    isLoggedIn: () => {
        return !!localStorage.getItem(SESSION_USER_KEY);
    },
};

export default authService;