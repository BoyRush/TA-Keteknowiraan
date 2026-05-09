// src/api/backend.js
import axios from 'axios';

export const API_BASE = 'http://127.0.0.1:5000';

export const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('herbalchain_token')}`
});