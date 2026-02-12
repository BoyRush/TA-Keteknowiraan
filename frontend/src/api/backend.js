// src/api/backend.js
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000';

export const getHerbalRecommendation = async (patientAddress, keluhan) => {
    return axios.post(`${API_BASE}/patient/request-recommendation`, {
        patient_address: patientAddress,
        keluhan: keluhan
    });
};

// Fungsi bantuan lainnya bisa ditaruh di sini