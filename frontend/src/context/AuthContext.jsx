import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3ModalAccount } from '@web3modal/ethers5/react';
import { useRouter } from 'next/router'; // 1. Import router
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { address, isConnected } = useWeb3ModalAccount();
    const [user, setUser] = useState({ address: null, role: null });
    const [loading, setLoading] = useState(false);
    const router = useRouter(); // 2. Inisialisasi router

    const checkRole = async (currentAddress) => {
        if (!currentAddress) return;
        setLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:5000/auth/login', { 
                address: currentAddress.toLowerCase() 
            });
            
            const userRole = response.data.role; 
            setUser({ address: currentAddress, role: userRole });

            // --- LOGIKA NAVIGASI (DIPERBARUI) ---
            if (userRole === 'herbal_doctor') {
                router.push('/herbs/dashboard');
            } else if (userRole === 'doctor') {
                router.push('/doctor/dashboard');
            } else if (userRole === 'patient') {
                router.push('/patient/dashboard');
            } else if (userRole === 'admin') {
                router.push('/admin/dashboard');
            } else if (userRole === 'none') {
                // Jika belum daftar, redirect ke register
                console.log("User belum terdaftar, mengarahkan ke registrasi...");
                router.push('/register');
            }
            
        } catch (error) {
            console.error("Login Error:", error);
            // Jika backend Flask kirim error 404 (Alamat belum terdaftar)
            if (error.response && error.response.status === 404) {
                setUser({ address: currentAddress, role: 'none' });
                router.push('/register');
            } else {
                setUser({ address: null, role: null });
                router.push('/'); 
            }
        } finally {
            setLoading(false);
        }
    };

    // ... useEffect tetap sama ...
    useEffect(() => {
        if (isConnected && address) {
            checkRole(address);
        } else if (!isConnected) {
            setUser({ address: null, role: null });
        }
    }, [isConnected, address]);

    return (
        <AuthContext.Provider value={{ ...user, isConnected, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);