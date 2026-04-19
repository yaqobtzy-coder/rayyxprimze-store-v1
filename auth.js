// auth.js
(function() {
    function generateDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }

    const DEVICE_ID = generateDeviceId();

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + DEVICE_ID);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function generateSessionToken(userId, username) {
        const tokenData = userId + username + DEVICE_ID + Date.now();
        const encoder = new TextEncoder();
        const hash = await crypto.subtle.digest('SHA-256', encoder.encode(tokenData));
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    window.register = async function(username, password) {
        if (!username || username.length < 3) return { success: false, message: "Username minimal 3 karakter!" };
        if (!password || password.length < 4) return { success: false, message: "Password minimal 4 karakter!" };

        try {
            const usersRef = window.dbRef(window.db, 'users');
            const snapshot = await window.dbGet(usersRef);
            
            if (snapshot.exists()) {
                const users = snapshot.val();
                for (let key in users) {
                    if (users[key].username === username) {
                        return { success: false, message: "Username sudah digunakan!" };
                    }
                }
            }

            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
            const hashedPassword = await hashPassword(password);
            
            const userData = {
                username: username,
                passwordHash: hashedPassword,
                role: 'member',
                koin: 1000,
                level: 'ROOKIE',
                isBanned: false,
                deviceId: DEVICE_ID,
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                sessionToken: null
            };
            
            await window.dbSet(window.dbRef(window.db, `users/${userId}`), userData);
            
            const sessionToken = await generateSessionToken(userId, username);
            await window.dbUpdate(window.dbRef(window.db, `users/${userId}`), { sessionToken: sessionToken });
            
            localStorage.setItem('session_token', sessionToken);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('username', username);
            localStorage.setItem('user_role', 'member');
            
            return { success: true, message: "Pendaftaran berhasil!", userId: userId };
        } catch (error) {
            return { success: false, message: "Terjadi kesalahan!" };
        }
    };

    window.login = async function(username, password) {
        if (!username || !password) return { success: false, message: "Isi username dan password!" };

        try {
            const usersRef = window.dbRef(window.db, 'users');
            const snapshot = await window.dbGet(usersRef);
            if (!snapshot.exists()) return { success: false, message: "Username tidak ditemukan!" };
            
            let userId = null, userData = null;
            const users = snapshot.val();
            const hashedInputPassword = await hashPassword(password);
            
            for (let key in users) {
                if (users[key].username === username) {
                    if (users[key].passwordHash === hashedInputPassword) {
                        userId = key;
                        userData = users[key];
                        break;
                    }
                }
            }
            
            if (!userId) return { success: false, message: "Password salah!" };
            if (userData.isBanned) return { success: false, message: "Akun telah diblokir!" };
            if (userData.deviceId && userData.deviceId !== DEVICE_ID) {
                return { success: false, message: "❌ Akun sedang aktif di perangkat lain!" };
            }
            
            const sessionToken = await generateSessionToken(userId, username);
            await window.dbUpdate(window.dbRef(window.db, `users/${userId}`), {
                deviceId: DEVICE_ID, sessionToken: sessionToken, lastLogin: new Date().toISOString()
            });
            
            localStorage.setItem('session_token', sessionToken);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('username', username);
            localStorage.setItem('user_role', userData.role || 'member');
            
            return { success: true, message: "Login berhasil!", userId: userId, userData: userData };
        } catch (error) {
            return { success: false, message: "Terjadi kesalahan!" };
        }
    };

    window.checkSession = async function() {
        const sessionToken = localStorage.getItem('session_token');
        const userId = localStorage.getItem('user_id');
        if (!sessionToken || !userId) return { success: false, user: null };
        
        try {
            const userRef = window.dbRef(window.db, `users/${userId}`);
            const snapshot = await window.dbGet(userRef);
            if (!snapshot.exists()) { localStorage.clear(); return { success: false, user: null }; }
            
            const userData = snapshot.val();
            if (userData.sessionToken !== sessionToken || userData.deviceId !== DEVICE_ID) {
                localStorage.clear(); return { success: false, user: null };
            }
            if (userData.isBanned) { localStorage.clear(); return { success: false, user: null }; }
            
            return { success: true, user: userData, userId: userId };
        } catch (error) {
            return { success: false, user: null };
        }
    };

    window.logout = async function() {
        const userId = localStorage.getItem('user_id');
        if (userId) {
            try {
                await window.dbUpdate(window.dbRef(window.db, `users/${userId}`), { sessionToken: null });
            } catch(e) {}
        }
        localStorage.clear();
        return { success: true };
    };

    window.getCurrentUser = function() {
        return {
            userId: localStorage.getItem('user_id'),
            username: localStorage.getItem('username'),
            role: localStorage.getItem('user_role'),
            isLoggedIn: !!localStorage.getItem('session_token')
        };
    };
})();