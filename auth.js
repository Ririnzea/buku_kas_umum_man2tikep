const AUTH_KEY = 'bku_user_session';
const CRED_KEY = 'bku_credentials';

const defaultCreds = {
    username: 'admin',
    password: 'admin123'
};

const auth = {
    getCredentials: function () {
        const stored = localStorage.getItem(CRED_KEY);
        return stored ? JSON.parse(stored) : defaultCreds;
    },

    login: function (username, password) {
        const creds = this.getCredentials();
        if (username === creds.username && password === creds.password) {
            localStorage.setItem(AUTH_KEY, JSON.stringify({
                user: username,
                token: Date.now()
            }));
            return true;
        }
        return false;
    },

    logout: function () {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = 'login.html';
    },

    changePassword: function (oldPassword, newPassword) {
        const creds = this.getCredentials();
        if (oldPassword !== creds.password) {
            return {
                success: false,
                message: 'Password lama salah!'
            };
        }

        creds.password = newPassword;
        localStorage.setItem(CRED_KEY, JSON.stringify(creds));
        return {
            success: true,
            message: 'Password berhasil diubah!'
        };
    },

    checkSession: function () {
        const session = localStorage.getItem(AUTH_KEY);
        const isLoginPage = window.location.pathname.endsWith('login.html');

        if (!session && !isLoginPage) {
            window.location.href = 'login.html';
        } else if (session && isLoginPage) {
            window.location.href = 'index.html';
        }
    },

    init: function () {
        // Run check on load
        this.checkSession();
    }
};

// Initialize only if not imported as a module (simple script tag usage)
if (typeof window !== 'undefined') {
    auth.init();
    // Expose for global use
    window.auth = auth;
}
