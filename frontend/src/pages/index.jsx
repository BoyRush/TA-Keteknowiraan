import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function IndexPage() {
    const router = useRouter();
    const { isAuthenticated, role, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (isAuthenticated) {
                if (role === 'doctor') router.replace('/doctor/dashboard');
                else if (role === 'herbal_doctor') router.replace('/herbs/dashboard');
                else if (role === 'patient') router.replace('/patient/dashboard');
                else if (role === 'admin') router.replace('/admin/dashboard');
            } else {
                router.replace('/login');
            }
        }
    }, [isAuthenticated, role, loading, router]);

    return <p>Redirecting...</p>;
}