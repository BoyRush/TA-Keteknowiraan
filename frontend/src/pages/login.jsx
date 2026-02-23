import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = async () => {
        if (!window.ethereum) return alert("Install MetaMask!");
        
        try {
            // 1. Ambil alamat dari MetaMask
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];

            // 2. Tanya ke Flask (app.py)
            const response = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: address })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Login Sukses sebagai ${data.role}`);
                // Redirect ke dashboard masing-masing
                if (data.role === 'admin') router.push('/admin');
                else if (data.role === 'patient') router.push('/patient/dashboard');
                else router.push('/doctor/dashboard');
            } else {
                alert(data.error || data.message);
            }
        } catch (error) {
            alert("Error login: " + error.message);
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '100px' }}>
            <h1>🌿 Herbal Chain AI</h1>
            <button onClick={handleLogin} style={{ padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px' }}>
                Connect MetaMask & Login
            </button>
        </div>
    );
}