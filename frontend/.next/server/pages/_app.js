"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./src/api/web3_config.js":
/*!********************************!*\
  !*** ./src/api/web3_config.js ***!
  \********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Web3ModalProvider: () => (/* binding */ Web3ModalProvider)\n/* harmony export */ });\n/* harmony import */ var _web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @web3modal/ethers5/react */ \"@web3modal/ethers5/react\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_0__]);\n_web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n// src/api/web3_config.js\n\n// Ganti Project ID ini dari https://cloud.walletconnect.com/\nconst projectId = \"7e16cf89a1bf9f2ba3c20a8d0305b5a8\";\nconst localhost = {\n    chainId: 1337,\n    name: \"Localhost 8545\",\n    currency: \"ETH\",\n    explorerUrl: \"\",\n    rpcUrl: \"http://127.0.0.1:8545\"\n};\nconst metadata = {\n    name: \"Herbal Chain AI\",\n    description: \"Sistem Rekomendasi Herbal Blockchain\",\n    url: \"http://localhost:5174\",\n    icons: [\n        \"https://avatars.mywebsite.com/\"\n    ]\n};\n(0,_web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_0__.createWeb3Modal)({\n    ethersConfig: (0,_web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_0__.defaultConfig)({\n        metadata\n    }),\n    chains: [\n        localhost\n    ],\n    projectId\n});\nfunction Web3ModalProvider({ children }) {\n    return children;\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvYXBpL3dlYjNfY29uZmlnLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEseUJBQXlCO0FBQ2dEO0FBRXpFLDZEQUE2RDtBQUM3RCxNQUFNRSxZQUFZO0FBRWxCLE1BQU1DLFlBQVk7SUFDaEJDLFNBQVM7SUFDVEMsTUFBTTtJQUNOQyxVQUFVO0lBQ1ZDLGFBQWE7SUFDYkMsUUFBUTtBQUNWO0FBRUEsTUFBTUMsV0FBVztJQUNmSixNQUFNO0lBQ05LLGFBQWE7SUFDYkMsS0FBSztJQUNMQyxPQUFPO1FBQUM7S0FBaUM7QUFDM0M7QUFFQVoseUVBQWVBLENBQUM7SUFDZGEsY0FBY1osdUVBQWFBLENBQUM7UUFBRVE7SUFBUztJQUN2Q0ssUUFBUTtRQUFDWDtLQUFVO0lBQ25CRDtBQUNGO0FBRU8sU0FBU2Esa0JBQWtCLEVBQUVDLFFBQVEsRUFBRTtJQUM1QyxPQUFPQTtBQUNUIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaGVyYmFsLWNoYWluLWZyb250ZW5kLy4vc3JjL2FwaS93ZWIzX2NvbmZpZy5qcz84MmViIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHNyYy9hcGkvd2ViM19jb25maWcuanNcclxuaW1wb3J0IHsgY3JlYXRlV2ViM01vZGFsLCBkZWZhdWx0Q29uZmlnIH0gZnJvbSAnQHdlYjNtb2RhbC9ldGhlcnM1L3JlYWN0J1xyXG5cclxuLy8gR2FudGkgUHJvamVjdCBJRCBpbmkgZGFyaSBodHRwczovL2Nsb3VkLndhbGxldGNvbm5lY3QuY29tL1xyXG5jb25zdCBwcm9qZWN0SWQgPSAnN2UxNmNmODlhMWJmOWYyYmEzYzIwYThkMDMwNWI1YTgnOyBcclxuXHJcbmNvbnN0IGxvY2FsaG9zdCA9IHtcclxuICBjaGFpbklkOiAxMzM3LFxyXG4gIG5hbWU6ICdMb2NhbGhvc3QgODU0NScsXHJcbiAgY3VycmVuY3k6ICdFVEgnLFxyXG4gIGV4cGxvcmVyVXJsOiAnJyxcclxuICBycGNVcmw6ICdodHRwOi8vMTI3LjAuMC4xOjg1NDUnXHJcbn1cclxuXHJcbmNvbnN0IG1ldGFkYXRhID0ge1xyXG4gIG5hbWU6ICdIZXJiYWwgQ2hhaW4gQUknLFxyXG4gIGRlc2NyaXB0aW9uOiAnU2lzdGVtIFJla29tZW5kYXNpIEhlcmJhbCBCbG9ja2NoYWluJyxcclxuICB1cmw6ICdodHRwOi8vbG9jYWxob3N0OjUxNzQnLCAvLyBTZXN1YWlrYW4gZGVuZ2FuIHBvcnQgVml0ZSBBbmRhXHJcbiAgaWNvbnM6IFsnaHR0cHM6Ly9hdmF0YXJzLm15d2Vic2l0ZS5jb20vJ11cclxufVxyXG5cclxuY3JlYXRlV2ViM01vZGFsKHtcclxuICBldGhlcnNDb25maWc6IGRlZmF1bHRDb25maWcoeyBtZXRhZGF0YSB9KSxcclxuICBjaGFpbnM6IFtsb2NhbGhvc3RdLFxyXG4gIHByb2plY3RJZFxyXG59KVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFdlYjNNb2RhbFByb3ZpZGVyKHsgY2hpbGRyZW4gfSkge1xyXG4gIHJldHVybiBjaGlsZHJlbjtcclxufSJdLCJuYW1lcyI6WyJjcmVhdGVXZWIzTW9kYWwiLCJkZWZhdWx0Q29uZmlnIiwicHJvamVjdElkIiwibG9jYWxob3N0IiwiY2hhaW5JZCIsIm5hbWUiLCJjdXJyZW5jeSIsImV4cGxvcmVyVXJsIiwicnBjVXJsIiwibWV0YWRhdGEiLCJkZXNjcmlwdGlvbiIsInVybCIsImljb25zIiwiZXRoZXJzQ29uZmlnIiwiY2hhaW5zIiwiV2ViM01vZGFsUHJvdmlkZXIiLCJjaGlsZHJlbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/api/web3_config.js\n");

/***/ }),

/***/ "./src/context/AuthContext.jsx":
/*!*************************************!*\
  !*** ./src/context/AuthContext.jsx ***!
  \*************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),\n/* harmony export */   useAuth: () => (/* binding */ useAuth)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @web3modal/ethers5/react */ \"@web3modal/ethers5/react\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! axios */ \"axios\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_2__, axios__WEBPACK_IMPORTED_MODULE_4__]);\n([_web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_2__, axios__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n// import React, { createContext, useContext, useState, useEffect } from 'react';\n// import { useWeb3ModalAccount } from '@web3modal/ethers5/react';\n// import axios from 'axios';\n// const AuthContext = createContext();\n// export const AuthProvider = ({ children }) => {\n//     const { address, isConnected } = useWeb3ModalAccount();\n//     const [user, setUser] = useState({ address: null, role: null });\n//     const [loading, setLoading] = useState(false);\n//     const checkRole = async (currentAddress) => {\n//         if (!currentAddress) return;\n//         setLoading(true);\n//         try {\n//             const response = await axios.post('http://127.0.0.1:5000/auth/login', { \n//                 address: currentAddress \n//             });\n//             setUser({ address: currentAddress, role: response.data.role });\n//         } catch (error) {\n//             console.error(\"Login Error:\", error);\n//             setUser({ address: null, role: null });\n//         } finally {\n//             setLoading(false);\n//         }\n//     };\n//     // Sinkronisasi saat pertama kali connect\n//     useEffect(() => {\n//         if (isConnected && address) {\n//             checkRole(address);\n//         } else if (!isConnected) {\n//             setUser({ address: null, role: null });\n//         }\n//     }, [isConnected, address]);\n//     // Listener otomatis saat ganti akun di MetaMask\n//     useEffect(() => {\n//         if (window.ethereum) {\n//             const handleAccountChange = (accounts) => {\n//                 if (accounts.length > 0) {\n//                     checkRole(accounts[0]);\n//                 } else {\n//                     setUser({ address: null, role: null });\n//                 }\n//             };\n//             window.ethereum.on('accountsChanged', handleAccountChange);\n//             return () => {\n//                 window.ethereum.removeListener('accountsChanged', handleAccountChange);\n//             };\n//         }\n//     }, []);\n//     return (\n//         <AuthContext.Provider value={{ ...user, isConnected, loading }}>\n//             {children}\n//         </AuthContext.Provider>\n//     );\n// };\n// export const useAuth = () => {\n//     const context = useContext(AuthContext);\n//     if (!context) {\n//         throw new Error(\"useAuth must be used within an AuthProvider\");\n//     }\n//     return context;\n// };\n\n\n\n // 1. Import router\n\nconst AuthContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)();\nconst AuthProvider = ({ children })=>{\n    const { address, isConnected } = (0,_web3modal_ethers5_react__WEBPACK_IMPORTED_MODULE_2__.useWeb3ModalAccount)();\n    const [user, setUser] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({\n        address: null,\n        role: null\n    });\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_3__.useRouter)(); // 2. Inisialisasi router\n    const checkRole = async (currentAddress)=>{\n        if (!currentAddress) return;\n        setLoading(true);\n        try {\n            const response = await axios__WEBPACK_IMPORTED_MODULE_4__[\"default\"].post(\"http://127.0.0.1:5000/auth/login\", {\n                address: currentAddress.toLowerCase()\n            });\n            const userRole = response.data.role;\n            setUser({\n                address: currentAddress,\n                role: userRole\n            });\n            // 3. LOGIKA NAVIGASI (Pindah Halaman Otomatis)\n            if (userRole === \"herbal_doctor\") {\n                router.push(\"/herbs/dashboard\");\n            } else if (userRole === \"doctor\") {\n                router.push(\"/doctor/dashboard\");\n            } else if (userRole === \"patient\") {\n                router.push(\"/patient/dashboard\");\n            }\n        } catch (error) {\n            console.error(\"Login Error:\", error);\n            setUser({\n                address: null,\n                role: null\n            });\n            router.push(\"/\"); // Jika error balik ke home\n        } finally{\n            setLoading(false);\n        }\n    };\n    // ... useEffect tetap sama ...\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        if (isConnected && address) {\n            checkRole(address);\n        } else if (!isConnected) {\n            setUser({\n                address: null,\n                role: null\n            });\n        }\n    }, [\n        isConnected,\n        address\n    ]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(AuthContext.Provider, {\n        value: {\n            ...user,\n            isConnected,\n            loading\n        },\n        children: children\n    }, void 0, false, {\n        fileName: \"D:\\\\Semester 7\\\\TA\\\\TA2\\\\Implementasi\\\\frontend\\\\src\\\\context\\\\AuthContext.jsx\",\n        lineNumber: 122,\n        columnNumber: 9\n    }, undefined);\n};\nconst useAuth = ()=>(0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AuthContext);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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U0FBUztnQkFBTUksTUFBTTtZQUFLO1FBQ3hDO0lBQ0osR0FBRztRQUFDSDtRQUFhRDtLQUFRO0lBRXpCLHFCQUNJLDhEQUFDSCxZQUFZcUIsUUFBUTtRQUFDQyxPQUFPO1lBQUUsR0FBR2pCLElBQUk7WUFBRUQ7WUFBYUk7UUFBUTtrQkFDeEROOzs7Ozs7QUFHYixFQUFFO0FBRUssTUFBTXFCLFVBQVUsSUFBTTdCLGlEQUFVQSxDQUFDTSxhQUFhIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaGVyYmFsLWNoYWluLWZyb250ZW5kLy4vc3JjL2NvbnRleHQvQXV0aENvbnRleHQuanN4PzgxNTkiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gaW1wb3J0IFJlYWN0LCB7IGNyZWF0ZUNvbnRleHQsIHVzZUNvbnRleHQsIHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XHJcbi8vIGltcG9ydCB7IHVzZVdlYjNNb2RhbEFjY291bnQgfSBmcm9tICdAd2ViM21vZGFsL2V0aGVyczUvcmVhY3QnO1xyXG4vLyBpbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5cclxuLy8gY29uc3QgQXV0aENvbnRleHQgPSBjcmVhdGVDb250ZXh0KCk7XHJcblxyXG4vLyBleHBvcnQgY29uc3QgQXV0aFByb3ZpZGVyID0gKHsgY2hpbGRyZW4gfSkgPT4ge1xyXG4vLyAgICAgY29uc3QgeyBhZGRyZXNzLCBpc0Nvbm5lY3RlZCB9ID0gdXNlV2ViM01vZGFsQWNjb3VudCgpO1xyXG4vLyAgICAgY29uc3QgW3VzZXIsIHNldFVzZXJdID0gdXNlU3RhdGUoeyBhZGRyZXNzOiBudWxsLCByb2xlOiBudWxsIH0pO1xyXG4vLyAgICAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xyXG5cclxuLy8gICAgIGNvbnN0IGNoZWNrUm9sZSA9IGFzeW5jIChjdXJyZW50QWRkcmVzcykgPT4ge1xyXG4vLyAgICAgICAgIGlmICghY3VycmVudEFkZHJlc3MpIHJldHVybjtcclxuLy8gICAgICAgICBzZXRMb2FkaW5nKHRydWUpO1xyXG4vLyAgICAgICAgIHRyeSB7XHJcbi8vICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXhpb3MucG9zdCgnaHR0cDovLzEyNy4wLjAuMTo1MDAwL2F1dGgvbG9naW4nLCB7IFxyXG4vLyAgICAgICAgICAgICAgICAgYWRkcmVzczogY3VycmVudEFkZHJlc3MgXHJcbi8vICAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgICAgICBzZXRVc2VyKHsgYWRkcmVzczogY3VycmVudEFkZHJlc3MsIHJvbGU6IHJlc3BvbnNlLmRhdGEucm9sZSB9KTtcclxuLy8gICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4vLyAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTG9naW4gRXJyb3I6XCIsIGVycm9yKTtcclxuLy8gICAgICAgICAgICAgc2V0VXNlcih7IGFkZHJlc3M6IG51bGwsIHJvbGU6IG51bGwgfSk7XHJcbi8vICAgICAgICAgfSBmaW5hbGx5IHtcclxuLy8gICAgICAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XHJcbi8vICAgICAgICAgfVxyXG4vLyAgICAgfTtcclxuXHJcbi8vICAgICAvLyBTaW5rcm9uaXNhc2kgc2FhdCBwZXJ0YW1hIGthbGkgY29ubmVjdFxyXG4vLyAgICAgdXNlRWZmZWN0KCgpID0+IHtcclxuLy8gICAgICAgICBpZiAoaXNDb25uZWN0ZWQgJiYgYWRkcmVzcykge1xyXG4vLyAgICAgICAgICAgICBjaGVja1JvbGUoYWRkcmVzcyk7XHJcbi8vICAgICAgICAgfSBlbHNlIGlmICghaXNDb25uZWN0ZWQpIHtcclxuLy8gICAgICAgICAgICAgc2V0VXNlcih7IGFkZHJlc3M6IG51bGwsIHJvbGU6IG51bGwgfSk7XHJcbi8vICAgICAgICAgfVxyXG4vLyAgICAgfSwgW2lzQ29ubmVjdGVkLCBhZGRyZXNzXSk7XHJcblxyXG4vLyAgICAgLy8gTGlzdGVuZXIgb3RvbWF0aXMgc2FhdCBnYW50aSBha3VuIGRpIE1ldGFNYXNrXHJcbi8vICAgICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4vLyAgICAgICAgIGlmICh3aW5kb3cuZXRoZXJldW0pIHtcclxuLy8gICAgICAgICAgICAgY29uc3QgaGFuZGxlQWNjb3VudENoYW5nZSA9IChhY2NvdW50cykgPT4ge1xyXG4vLyAgICAgICAgICAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA+IDApIHtcclxuLy8gICAgICAgICAgICAgICAgICAgICBjaGVja1JvbGUoYWNjb3VudHNbMF0pO1xyXG4vLyAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgICAgICAgICAgICAgICBzZXRVc2VyKHsgYWRkcmVzczogbnVsbCwgcm9sZTogbnVsbCB9KTtcclxuLy8gICAgICAgICAgICAgICAgIH1cclxuLy8gICAgICAgICAgICAgfTtcclxuXHJcbi8vICAgICAgICAgICAgIHdpbmRvdy5ldGhlcmV1bS5vbignYWNjb3VudHNDaGFuZ2VkJywgaGFuZGxlQWNjb3VudENoYW5nZSk7XHJcbiAgICAgICAgICAgIFxyXG4vLyAgICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xyXG4vLyAgICAgICAgICAgICAgICAgd2luZG93LmV0aGVyZXVtLnJlbW92ZUxpc3RlbmVyKCdhY2NvdW50c0NoYW5nZWQnLCBoYW5kbGVBY2NvdW50Q2hhbmdlKTtcclxuLy8gICAgICAgICAgICAgfTtcclxuLy8gICAgICAgICB9XHJcbi8vICAgICB9LCBbXSk7XHJcblxyXG4vLyAgICAgcmV0dXJuIChcclxuLy8gICAgICAgICA8QXV0aENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3sgLi4udXNlciwgaXNDb25uZWN0ZWQsIGxvYWRpbmcgfX0+XHJcbi8vICAgICAgICAgICAgIHtjaGlsZHJlbn1cclxuLy8gICAgICAgICA8L0F1dGhDb250ZXh0LlByb3ZpZGVyPlxyXG4vLyAgICAgKTtcclxuLy8gfTtcclxuXHJcbi8vIGV4cG9ydCBjb25zdCB1c2VBdXRoID0gKCkgPT4ge1xyXG4vLyAgICAgY29uc3QgY29udGV4dCA9IHVzZUNvbnRleHQoQXV0aENvbnRleHQpO1xyXG4vLyAgICAgaWYgKCFjb250ZXh0KSB7XHJcbi8vICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidXNlQXV0aCBtdXN0IGJlIHVzZWQgd2l0aGluIGFuIEF1dGhQcm92aWRlclwiKTtcclxuLy8gICAgIH1cclxuLy8gICAgIHJldHVybiBjb250ZXh0O1xyXG4vLyB9O1xyXG5pbXBvcnQgUmVhY3QsIHsgY3JlYXRlQ29udGV4dCwgdXNlQ29udGV4dCwgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHsgdXNlV2ViM01vZGFsQWNjb3VudCB9IGZyb20gJ0B3ZWIzbW9kYWwvZXRoZXJzNS9yZWFjdCc7XHJcbmltcG9ydCB7IHVzZVJvdXRlciB9IGZyb20gJ25leHQvcm91dGVyJzsgLy8gMS4gSW1wb3J0IHJvdXRlclxyXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5cclxuY29uc3QgQXV0aENvbnRleHQgPSBjcmVhdGVDb250ZXh0KCk7XHJcblxyXG5leHBvcnQgY29uc3QgQXV0aFByb3ZpZGVyID0gKHsgY2hpbGRyZW4gfSkgPT4ge1xyXG4gICAgY29uc3QgeyBhZGRyZXNzLCBpc0Nvbm5lY3RlZCB9ID0gdXNlV2ViM01vZGFsQWNjb3VudCgpO1xyXG4gICAgY29uc3QgW3VzZXIsIHNldFVzZXJdID0gdXNlU3RhdGUoeyBhZGRyZXNzOiBudWxsLCByb2xlOiBudWxsIH0pO1xyXG4gICAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gICAgY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKCk7IC8vIDIuIEluaXNpYWxpc2FzaSByb3V0ZXJcclxuXHJcbiAgICBjb25zdCBjaGVja1JvbGUgPSBhc3luYyAoY3VycmVudEFkZHJlc3MpID0+IHtcclxuICAgICAgICBpZiAoIWN1cnJlbnRBZGRyZXNzKSByZXR1cm47XHJcbiAgICAgICAgc2V0TG9hZGluZyh0cnVlKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGF4aW9zLnBvc3QoJ2h0dHA6Ly8xMjcuMC4wLjE6NTAwMC9hdXRoL2xvZ2luJywgeyBcclxuICAgICAgICAgICAgICAgIGFkZHJlc3M6IGN1cnJlbnRBZGRyZXNzLnRvTG93ZXJDYXNlKCkgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgdXNlclJvbGUgPSByZXNwb25zZS5kYXRhLnJvbGU7XHJcbiAgICAgICAgICAgIHNldFVzZXIoeyBhZGRyZXNzOiBjdXJyZW50QWRkcmVzcywgcm9sZTogdXNlclJvbGUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyAzLiBMT0dJS0EgTkFWSUdBU0kgKFBpbmRhaCBIYWxhbWFuIE90b21hdGlzKVxyXG4gICAgICAgICAgICBpZiAodXNlclJvbGUgPT09ICdoZXJiYWxfZG9jdG9yJykge1xyXG4gICAgICAgICAgICAgICAgcm91dGVyLnB1c2goJy9oZXJicy9kYXNoYm9hcmQnKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh1c2VyUm9sZSA9PT0gJ2RvY3RvcicpIHtcclxuICAgICAgICAgICAgICAgIHJvdXRlci5wdXNoKCcvZG9jdG9yL2Rhc2hib2FyZCcpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVzZXJSb2xlID09PSAncGF0aWVudCcpIHtcclxuICAgICAgICAgICAgICAgIHJvdXRlci5wdXNoKCcvcGF0aWVudC9kYXNoYm9hcmQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTG9naW4gRXJyb3I6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgc2V0VXNlcih7IGFkZHJlc3M6IG51bGwsIHJvbGU6IG51bGwgfSk7XHJcbiAgICAgICAgICAgIHJvdXRlci5wdXNoKCcvJyk7IC8vIEppa2EgZXJyb3IgYmFsaWsga2UgaG9tZVxyXG4gICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gLi4uIHVzZUVmZmVjdCB0ZXRhcCBzYW1hIC4uLlxyXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgICAgICBpZiAoaXNDb25uZWN0ZWQgJiYgYWRkcmVzcykge1xyXG4gICAgICAgICAgICBjaGVja1JvbGUoYWRkcmVzcyk7XHJcbiAgICAgICAgfSBlbHNlIGlmICghaXNDb25uZWN0ZWQpIHtcclxuICAgICAgICAgICAgc2V0VXNlcih7IGFkZHJlc3M6IG51bGwsIHJvbGU6IG51bGwgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgW2lzQ29ubmVjdGVkLCBhZGRyZXNzXSk7XHJcblxyXG4gICAgcmV0dXJuIChcclxuICAgICAgICA8QXV0aENvbnRleHQuUHJvdmlkZXIgdmFsdWU9e3sgLi4udXNlciwgaXNDb25uZWN0ZWQsIGxvYWRpbmcgfX0+XHJcbiAgICAgICAgICAgIHtjaGlsZHJlbn1cclxuICAgICAgICA8L0F1dGhDb250ZXh0LlByb3ZpZGVyPlxyXG4gICAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCB1c2VBdXRoID0gKCkgPT4gdXNlQ29udGV4dChBdXRoQ29udGV4dCk7Il0sIm5hbWVzIjpbIlJlYWN0IiwiY3JlYXRlQ29udGV4dCIsInVzZUNvbnRleHQiLCJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsInVzZVdlYjNNb2RhbEFjY291bnQiLCJ1c2VSb3V0ZXIiLCJheGlvcyIsIkF1dGhDb250ZXh0IiwiQXV0aFByb3ZpZGVyIiwiY2hpbGRyZW4iLCJhZGRyZXNzIiwiaXNDb25uZWN0ZWQiLCJ1c2VyIiwic2V0VXNlciIsInJvbGUiLCJsb2FkaW5nIiwic2V0TG9hZGluZyIsInJvdXRlciIsImNoZWNrUm9sZSIsImN1cnJlbnRBZGRyZXNzIiwicmVzcG9uc2UiLCJwb3N0IiwidG9Mb3dlckNhc2UiLCJ1c2VyUm9sZSIsImRhdGEiLCJwdXNoIiwiZXJyb3IiLCJjb25zb2xlIiwiUHJvdmlkZXIiLCJ2YWx1ZSIsInVzZUF1dGgiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/context/AuthContext.jsx\n");

/***/ }),

/***/ "./src/pages/_app.jsx":
/*!****************************!*\
  !*** ./src/pages/_app.jsx ***!
  \****************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _api_web3_config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../api/web3_config */ \"./src/api/web3_config.js\");\n/* harmony import */ var _context_AuthContext__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../context/AuthContext */ \"./src/context/AuthContext.jsx\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_api_web3_config__WEBPACK_IMPORTED_MODULE_2__, _context_AuthContext__WEBPACK_IMPORTED_MODULE_3__]);\n([_api_web3_config__WEBPACK_IMPORTED_MODULE_2__, _context_AuthContext__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    const [mounted, setMounted] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        setMounted(true); // Memastikan kode hanya jalan di browser\n    }, []);\n    if (!mounted) return null;\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_api_web3_config__WEBPACK_IMPORTED_MODULE_2__.Web3ModalProvider, {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_context_AuthContext__WEBPACK_IMPORTED_MODULE_3__.AuthProvider, {\n            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"D:\\\\Semester 7\\\\TA\\\\TA2\\\\Implementasi\\\\frontend\\\\src\\\\pages\\\\_app.jsx\",\n                lineNumber: 17,\n                columnNumber: 9\n            }, this)\n        }, void 0, false, {\n            fileName: \"D:\\\\Semester 7\\\\TA\\\\TA2\\\\Implementasi\\\\frontend\\\\src\\\\pages\\\\_app.jsx\",\n            lineNumber: 16,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"D:\\\\Semester 7\\\\TA\\\\TA2\\\\Implementasi\\\\frontend\\\\src\\\\pages\\\\_app.jsx\",\n        lineNumber: 15,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2FwcC5qc3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBNEM7QUFDVztBQUNEO0FBRXRELFNBQVNJLE1BQU0sRUFBRUMsU0FBUyxFQUFFQyxTQUFTLEVBQUU7SUFDckMsTUFBTSxDQUFDQyxTQUFTQyxXQUFXLEdBQUdQLCtDQUFRQSxDQUFDO0lBRXZDRCxnREFBU0EsQ0FBQztRQUNSUSxXQUFXLE9BQU8seUNBQXlDO0lBQzdELEdBQUcsRUFBRTtJQUVMLElBQUksQ0FBQ0QsU0FBUyxPQUFPO0lBRXJCLHFCQUNFLDhEQUFDTCwrREFBaUJBO2tCQUNoQiw0RUFBQ0MsOERBQVlBO3NCQUNYLDRFQUFDRTtnQkFBVyxHQUFHQyxTQUFTOzs7Ozs7Ozs7Ozs7Ozs7O0FBSWhDO0FBRUEsaUVBQWVGLEtBQUtBLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9oZXJiYWwtY2hhaW4tZnJvbnRlbmQvLi9zcmMvcGFnZXMvX2FwcC5qc3g/NGM3NyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSBcInJlYWN0XCI7XHJcbmltcG9ydCB7IFdlYjNNb2RhbFByb3ZpZGVyIH0gZnJvbSBcIi4uL2FwaS93ZWIzX2NvbmZpZ1wiO1xyXG5pbXBvcnQgeyBBdXRoUHJvdmlkZXIgfSBmcm9tIFwiLi4vY29udGV4dC9BdXRoQ29udGV4dFwiO1xyXG5cclxuZnVuY3Rpb24gTXlBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XHJcbiAgY29uc3QgW21vdW50ZWQsIHNldE1vdW50ZWRdID0gdXNlU3RhdGUoZmFsc2UpO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgc2V0TW91bnRlZCh0cnVlKTsgLy8gTWVtYXN0aWthbiBrb2RlIGhhbnlhIGphbGFuIGRpIGJyb3dzZXJcclxuICB9LCBbXSk7XHJcblxyXG4gIGlmICghbW91bnRlZCkgcmV0dXJuIG51bGw7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8V2ViM01vZGFsUHJvdmlkZXI+XHJcbiAgICAgIDxBdXRoUHJvdmlkZXI+XHJcbiAgICAgICAgPENvbXBvbmVudCB7Li4ucGFnZVByb3BzfSAvPlxyXG4gICAgICA8L0F1dGhQcm92aWRlcj5cclxuICAgIDwvV2ViM01vZGFsUHJvdmlkZXI+XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgTXlBcHA7Il0sIm5hbWVzIjpbInVzZUVmZmVjdCIsInVzZVN0YXRlIiwiV2ViM01vZGFsUHJvdmlkZXIiLCJBdXRoUHJvdmlkZXIiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsIm1vdW50ZWQiLCJzZXRNb3VudGVkIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/pages/_app.jsx\n");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "react/jsx-runtime":
/*!************************************!*\
  !*** external "react/jsx-runtime" ***!
  \************************************/
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ "@web3modal/ethers5/react":
/*!*******************************************!*\
  !*** external "@web3modal/ethers5/react" ***!
  \*******************************************/
/***/ ((module) => {

module.exports = import("@web3modal/ethers5/react");;

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/***/ ((module) => {

module.exports = import("axios");;

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./src/pages/_app.jsx")));
module.exports = __webpack_exports__;

})();