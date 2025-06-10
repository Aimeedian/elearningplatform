// src/api.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Helper to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create an Axios instance with a base URL and a request interceptor for auth
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    config => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// --- Existing Authentication Endpoints ---
export const registerUser = (userData) => {
    return api.post('/registration', userData);
};

export const loginUser = (loginData) => {
    return api.post('/login', loginData);
};

export const resetPassword = (email) => {
    return api.post('/reset', { email });
};

// --- Existing Lecturer/Course Management Endpoints (if still needed for LecturerDashboard) ---
export const fetchCourses = () => {
    return api.get('/courses'); // Assuming this fetches courses for the logged-in lecturer
};

export const addCourse = (courseData) => {
    return api.post('/courses', courseData);
};

export const updateCourse = (id, courseData) => {
    return api.put(`/courses/${id}`, courseData);
};

export const deleteCourse = (id) => {
    return api.delete(`/courses/${id}`);
};

export const uploadFiles = (formData) => {
    return api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

// --- Admin Module Management Endpoints ---
export const fetchAllModules = () => {
    return api.get('/admin/modules');
};

export const addModuleAdmin = (moduleData) => {
    return api.post('/admin/modules', moduleData);
};

export const updateModuleAdmin = (id, moduleData) => {
    return api.put(`/admin/modules/${id}`, moduleData);
};

export const deleteModuleAdmin = (id) => {
    return api.delete(`/admin/modules/${id}`);
};

export const publishModule = (id) => {
    return api.post(`/admin/modules/${id}/publish`);
};

export const assignInstructorToModule = (moduleId, instructorId) => {
    return api.post(`/admin/modules/${moduleId}/assign-instructor`, { instructor_id: instructorId });
};

// --- Admin User Management Endpoints ---
export const fetchAllUsers = () => {
    return api.get('/admin/users');
};

export const updateUserRole = (userId, newRole) => {
    return api.put(`/admin/users/${userId}/role`, { role: newRole });
};

export const updateUserStatus = (userId, newStatus) => {
    return api.put(`/admin/users/${userId}/status`, { status: newStatus });
};

export const deleteUser = (userId) => {
    return api.delete(`/admin/users/${userId}`);
};

// --- Admin Reports Endpoints ---
export const fetchEnrollmentReports = () => {
    return api.get('/admin/reports/enrollments');
};

export const fetchAssessmentReports = () => {
    return api.get('/admin/reports/assessments');
};

// --- NEW: Fetch Lecturers for Admin Assignment ---
export const fetchLecturers = () => {
    return api.get('/admin/lecturers');
};