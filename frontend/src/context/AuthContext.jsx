import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({ username: null, role: null, fullName: null, status: null, id: null, email: null });
    const [membership, setMembership] = useState({
        tier: 'basic',
        quotaUsed: 0,
        quotaLimit: 3,
        premiumUntil: null,
        referralCode: null
    });
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('herbalchain_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get('http://127.0.0.1:5000/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.user) {
                const userData = res.data.user;
                setUser({
                    id: userData.id,
                    username: userData.username,
                    role: userData.role,
                    status: userData.verification_status,
                    fullName: userData.full_name,
                    email: userData.email
                });
                setIsAuthenticated(true);
                
                if (userData.role === 'patient') {
                    refreshMembership();
                }
            }
        } catch (error) {
            console.error("Session expired or invalid", error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const refreshMembership = async () => {
        const token = localStorage.getItem('herbalchain_token');
        if (!token) return;
        
        try {
            const res = await axios.get(`http://127.0.0.1:5000/sh/user/quota-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setMembership({
                    tier: res.data.tier,
                    quotaUsed: res.data.quota_used,
                    quotaLimit: res.data.quota_limit,
                    premiumUntil: res.data.premium_until,
                    referralCode: res.data.referral_code
                });
            }
        } catch (e) {
            console.error("Failed to fetch membership:", e);
        }
    };

    const loginWithPassword = async (username, password) => {
        try {
            const res = await axios.post('http://127.0.0.1:5000/auth/login', { username, password });
            
            if (res.data.status === 'success') {
                const { token, user: userData } = res.data;
                localStorage.setItem('herbalchain_token', token);
                
                setUser({
                    id: userData.id,
                    username: userData.username,
                    role: userData.role,
                    fullName: userData.full_name,
                    status: userData.status,
                    email: userData.email
                });
                setIsAuthenticated(true);
                
                if (userData.status === 'pending') {
                    router.push('/pending-verification');
                    return { success: true };
                }

                if (userData.role === 'patient') {
                    await refreshMembership();
                    router.push('/patient/dashboard');
                }
                else if (userData.role === 'herbal_doctor') router.push('/herbs/dashboard');
                else if (userData.role === 'doctor') router.push('/doctor/dashboard');
                else if (userData.role === 'admin') router.push('/admin/dashboard');

                return { success: true };
            }
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            return { success: false, error: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem('herbalchain_token');
        setUser({ username: null, role: null, fullName: null, status: null, id: null, email: null });
        setMembership({
            tier: 'basic',
            quotaUsed: 0,
            quotaLimit: 3,
            premiumUntil: null,
            referralCode: null
        });
        setIsAuthenticated(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ 
            ...user, 
            membership,
            loading, 
            isAuthenticated,
            loginWithPassword,
            logout,
            refreshMembership
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);