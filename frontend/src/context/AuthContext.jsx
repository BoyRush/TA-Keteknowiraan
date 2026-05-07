import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useWeb3ModalAccount, useWeb3Modal } from '@web3modal/ethers5/react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

const getStoredSession = () => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('herbalchain_session');
        if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return null;
};

export const AuthProvider = ({ children }) => {
    const { address, isConnected } = useWeb3ModalAccount();
    const { open } = useWeb3Modal();
    
    const storedSession = getStoredSession();
    const [user, setUser] = useState(
        storedSession 
            ? { address: storedSession.address, role: storedSession.role, userName: storedSession.userName, status: storedSession.status }
            : { address: null, role: null, userName: null, status: null }
    );
    const [membership, setMembership] = useState({
        tier: 'basic',
        quotaUsed: 0,
        quotaLimit: 3,
        premiumUntil: null,
        referralCode: null
    });
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!storedSession);
    const router = useRouter();
    const prevAddressRef = useRef(storedSession?.address || null);

    useEffect(() => {
        const stored = getStoredSession();
        if (isConnected && address && stored && stored.address?.toLowerCase() === address?.toLowerCase()) {
            setIsAuthenticated(true);
        } else if (!isConnected || !address) {
            setIsAuthenticated(false);
        } else if (stored && stored.address?.toLowerCase() !== address?.toLowerCase()) {
            setIsAuthenticated(false);
            localStorage.removeItem('herbalchain_session');
            setUser({ address: address, role: null, userName: null, status: null });
        }
    }, [isConnected, address]);

    useEffect(() => {
        if (user.role && user.address) {
            localStorage.setItem('herbalchain_session', JSON.stringify({
                address: user.address,
                role: user.role,
                userName: user.userName,
                status: user.status
            }));
            // Hanya panggil refreshMembership untuk pasien
            // Admin dan Dokter tidak terdaftar di SmartHerbal DB (sh_users)
            if (user.role === 'patient') {
                refreshMembership(user.address);
            }
        }
    }, [user]);

    const refreshMembership = async (walletAddress) => {
        try {
            const addr = walletAddress || user.address;
            if (!addr) return;
            const res = await fetch(`http://127.0.0.1:5000/sh/user/quota-status?address=${addr}`);
            if (res.ok) {
                const data = await res.json();
                setMembership({
                    tier: data.tier,
                    quotaUsed: data.quota_used,
                    quotaLimit: data.quota_limit,
                    premiumUntil: data.premium_until,
                    referralCode: data.referral_code
                });
            }
        } catch (e) {
            console.error("Failed to fetch membership:", e);
        }
    };

    const connectWallet = async () => {
        try {
            await open();
        } catch (error) {
            console.error("Wallet connection error:", error);
        }
    };

    // Bypass login untuk Admin - langsung set session
    const ADMIN_ADDRESS = '0xf51de12261f60b677fdf4306b6ff54dc98aeaca3';
    const loginAsAdmin = (walletAddress) => {
        const adminSession = {
            address: walletAddress,
            role: 'admin',
            userName: 'Administrator',
            status: 'active'
        };
        setUser(adminSession);
        setIsAuthenticated(true);
        localStorage.setItem('herbalchain_session', JSON.stringify(adminSession));
        router.push('/admin/dashboard');
        return { success: true, data: adminSession };
    };

    const setSession = (sessionData) => {
        setUser({
            address: sessionData.address,
            role: sessionData.role,
            userName: sessionData.userName || null,
            status: sessionData.status || null
        });
        setIsAuthenticated(true);
    };

    const checkStatus = async () => {
        const stored = getStoredSession();
        if (!stored?.address) return;
        try {
            // 1. Cek status dari DB (untuk deteksi 'verified' oleh admin)
            const statusRes = await fetch(`http://127.0.0.1:5000/auth/status/${stored.address}`);
            const statusData = await statusRes.json();

            if (statusData.verification_status === 'verified') {
                // 2. Konfirmasi ke blockchain untuk mendapatkan role yang akurat
                const roleRes = await fetch(`http://127.0.0.1:5000/auth/check-role/${stored.address}`);
                const roleData = await roleRes.json();

                // Jika blockchain mengatakan masih pending, jangan redirect ke dashboard
                if (roleData.status === 'pending_approval') {
                    console.warn('DB says verified but blockchain still pending. Waiting...');
                    return;
                }

                // Pastikan role diambil dari blockchain (bukan dari stored session yang bisa salah)
                const confirmedRole = roleData.role;
                if (!confirmedRole || confirmedRole === 'none' || confirmedRole === 'unknown') return;

                const newUser = {
                    address: stored.address,
                    role: confirmedRole,
                    userName: roleData.name || stored.userName,
                    status: 'active'
                };
                setUser(newUser);
                setIsAuthenticated(true);
                localStorage.setItem('herbalchain_session', JSON.stringify(newUser));

                // Routing sesuai role yang dikonfirmasi blockchain
                if (confirmedRole === 'herbal_doctor') {
                    router.push('/herbs/dashboard');
                } else if (confirmedRole === 'doctor') {
                    router.push('/doctor/dashboard');
                }
            }
        } catch (err) {
            console.error('checkStatus error:', err);
        }
    };

    const loginWithPassword = async (walletAddress, password) => {
        try {
            // Coba login SmartHerbal
            let response = await fetch('http://127.0.0.1:5000/sh/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: walletAddress, password })
            });

            let data = await response.json();
            const shLoginFailed = !response.ok; // tandai jika SH login gagal

            // Jika bukan pasien SmartHerbal atau salah password, coba /auth/login (untuk dokter/admin)
            if (!response.ok) {
                response = await fetch('http://127.0.0.1:5000/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: walletAddress, password })
                });
                data = await response.json();
            }

            if (response.ok) {
                const userRole = data.role;

                // Handle kasus registrasi tidak lengkap: wallet di MySQL tapi tidak di Blockchain
                // Backend mengembalikan role:'none', status:'incomplete' dengan HTTP 202
                if (!userRole || userRole === 'none') {
                    if (data.status === 'revoked') {
                        return {
                            success: false,
                            error: data.error || "Akun Dokter Anda telah dicabut izinnya oleh Admin.",
                            message: data.message || "Silakan lakukan registrasi ulang untuk mengajukan izin kembali.",
                            status: 'revoked'
                        };
                    }
                    return {
                        success: false,
                        error: data.error || "Registrasi belum selesai.",
                        message: "Buka halaman Registrasi dan selesaikan transaksi Blockchain untuk mengaktifkan akun Anda.",
                        status: data.status
                    };
                }

                setUser({ address: walletAddress, role: userRole, userName: data.name, status: data.status });
                setIsAuthenticated(true);

                // Auto-register ke SmartHerbal DB jika pasien belum terdaftar di sana
                // (terjadi saat user terdaftar di user_auth (TA DB) tapi belum ada di sh_users)
                if (shLoginFailed && userRole === 'patient') {
                    try {
                        await fetch('http://127.0.0.1:5000/sh/auth/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: walletAddress, name: data.name || '', password })
                        });
                        console.log('✅ Auto-registered ke SmartHerbal DB');
                    } catch (shRegErr) {
                        console.warn('Auto-register SH (diabaikan):', shRegErr);
                    }
                }

                if (data.status === 'pending_approval') {
                    router.push('/pending-verification');
                    return { success: true, data };
                }

                if (userRole === 'herbal_doctor') {
                    router.push('/herbs/dashboard');
                } else if (userRole === 'doctor') {
                    router.push('/doctor/dashboard');
                } else if (userRole === 'patient') {
                    router.push('/patient/dashboard');
                } else if (userRole === 'admin') {
                    router.push('/admin/dashboard');
                }
                return { success: true, data };
            } else {
                return { success: false, error: data.error || data.message, message: data.message };
            }
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        if (isConnected && address) {
            if (prevAddressRef.current && prevAddressRef.current.toLowerCase() !== address.toLowerCase()) {
                console.log('🔄 MetaMask account changed, redirecting to /login');
                setUser({ address: address, role: null, userName: null, status: null });
                setIsAuthenticated(false);
                localStorage.removeItem('herbalchain_session');
                router.push('/login');
            } else {
                setUser(prev => ({ ...prev, address: address }));
            }
            prevAddressRef.current = address;
        } else if (!isConnected) {
            const stored = getStoredSession();
            if (!stored) {
                setUser({ address: null, role: null, userName: null, status: null });
                setIsAuthenticated(false);
            }
            prevAddressRef.current = null;
        }
    }, [isConnected, address]);

    useEffect(() => {
        if (isConnected && address && !isAuthenticated) {
            const currentPath = router.pathname;
            if (currentPath === '/') {
                router.push('/login');
            }
        }
    }, [isConnected, address, isAuthenticated]);

    const logout = () => {
        setUser({ address: null, role: null, userName: null, status: null });
        setIsAuthenticated(false);
        prevAddressRef.current = null;
        localStorage.removeItem('herbalchain_session');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ 
            ...user, 
            membership,
            isConnected, 
            loading, 
            isAuthenticated,
            connectWallet, 
            loginWithPassword,
            loginAsAdmin,
            ADMIN_ADDRESS,
            setSession,
            checkStatus,
            logout,
            refreshMembership
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);