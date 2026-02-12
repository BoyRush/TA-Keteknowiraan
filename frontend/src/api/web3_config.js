// src/api/web3_config.js
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react'

// Ganti Project ID ini dari https://cloud.walletconnect.com/
const projectId = '7e16cf89a1bf9f2ba3c20a8d0305b5a8'; 

const localhost = {
  chainId: 1337,
  name: 'Localhost 8545',
  currency: 'ETH',
  explorerUrl: '',
  rpcUrl: 'http://127.0.0.1:8545'
}

const metadata = {
  name: 'Herbal Chain AI',
  description: 'Sistem Rekomendasi Herbal Blockchain',
  url: 'http://localhost:5174', // Sesuaikan dengan port Vite Anda
  icons: ['https://avatars.mywebsite.com/']
}

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [localhost],
  projectId
})

export function Web3ModalProvider({ children }) {
  return children;
}