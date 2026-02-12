import { useEffect, useState } from "react";
import { Web3ModalProvider } from "../api/web3_config";
import { AuthProvider } from "../context/AuthContext";

function MyApp({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Memastikan kode hanya jalan di browser
  }, []);

  if (!mounted) return null;

  return (
    <Web3ModalProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </Web3ModalProvider>
  );
}

export default MyApp;