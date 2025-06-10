// src/components/LoginRegister/LoginRegister.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdOutlineLockPerson,
    MdDriveFileRenameOutline,
    MdAttachEmail,
} from 'react-icons/md';
import {
    FaUserShield,
    FaUserGraduate,
    FaChalkboardTeacher,
    FaUserCog,
} from 'react-icons/fa';
import './LoginRegister.css';

import {
    registerUser,
    loginUser,
    resetPassword,
} from '../../api';  // Assuming api.js is in src/

const LoginRegister = ({ onLoginSuccess }) => {
    const [formType, setFormType] = useState('login');
    const [role, setRole] = useState('learner'); // default role on register
    const [loginStatus, setLoginStatus] = useState(null);

    const navigate = useNavigate();

    // Registration form state with all fields
    const [registerData, setRegisterData] = useState({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        password: '',
    });

    // Login form state
    const [loginData, setLoginData] = useState({
        username: '',
        password: '',
    });

    // Reset password email state
    const [resetEmail, setResetEmail] = useState('');

    // Register handler
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginStatus(null);

        // Basic required field validation
        if (
            !registerData.firstname ||
            !registerData.lastname ||
            !registerData.username ||
            !registerData.email ||
            !registerData.password
        ) {
            setLoginStatus('Please fill in all required fields.');
            return;
        }

        try {
            console.log('Registering user:', { ...registerData, role });
            const response = await registerUser({ ...registerData, role });
            const data = response.data;

            if (response.status === 200 || response.status === 201) {
                setLoginStatus('Registration successful! Please log in.');
                alert('Registration successful! You can now log in.');
                setFormType('login');
                setRegisterData({
                    firstname: '',
                    lastname: '',
                    username: '',
                    email: '',
                    password: '',
                });
            } else {
                setLoginStatus(data.error || 'Registration failed. Please try again.');
                alert('Registration failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Registration error:', error.response?.data || error.message);
            setLoginStatus(error.response?.data?.error || 'Network or server error. Please try again later.');
            alert('Registration failed: Network or server error');
        }
    };

    // Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginStatus(null);

        if (!loginData.username || !loginData.password) {
            setLoginStatus('Please enter your username and password.');
            return;
        }

        try {
            console.log('Logging in:', loginData.username);
            const response = await loginUser(loginData);
            const data = response.data;

            if (response.status === 200) {
                setLoginStatus('Login successful!');
                // Save token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('username', data.username);

                if (onLoginSuccess) {
                    onLoginSuccess(data.token, data.role, data.username);
                }

                // Navigate based on role
                if (data.role === 'learner') {
                    navigate('/dashboard/learner');
                } else if (data.role === 'lecturer') {
                    navigate('/dashboard/lecturer');
                } else if (data.role === 'administrator') {
                    navigate('/dashboard/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setLoginStatus(data.error || 'Invalid username or password.');
                alert('Login failed: ' + (data.error || 'Invalid credentials'));
            }
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            setLoginStatus(error.response?.data?.error || 'Network or server error. Please try again later.');
            alert('Login failed: Network or server error');
        }
    };

    // Reset password handler
    const handleReset = async (e) => {
        e.preventDefault();
        setLoginStatus(null);

        if (!resetEmail) {
            setLoginStatus('Please enter your email address for password reset.');
            return;
        }

        try {
            console.log('Password reset request for:', resetEmail);
            const response = await resetPassword(resetEmail);
            const data = response.data;

            if (response.status === 200) {
                setLoginStatus(data.message || 'If an account with that email exists, a password reset link has been sent.');
                alert(data.message || 'If an account with that email exists, a password reset link has been sent.');
                setFormType('login');
                setResetEmail('');
            } else {
                setLoginStatus(data.error || 'Failed to send reset link. Please try again.');
                alert('Reset failed: ' + (data.error || 'Failed to send reset link.'));
            }
        } catch (error) {
            console.error('Reset password error:', error.response?.data || error.message);
            setLoginStatus(error.response?.data?.error || 'Network or server error during reset request.');
            alert('Reset failed: Network or server error');
        }
    };

    return (
        <div className="wrapper">

            {/* LOGIN FORM */}
            {formType === 'login' && (
                <div className="form-box login">
                    <form onSubmit={handleLogin}>
                        <h1>LOGIN</h1>
                        {loginStatus && (
                            <p className={`status-message ${loginStatus.includes('successful') ? 'success' : 'error'}`}>
                                {loginStatus}
                            </p>
                        )}
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={loginData.username}
                                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            />
                            <FaUserShield className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            />
                            <MdOutlineLockPerson className="icon" />
                        </div>
                        <div className="remember-forgot">
                            <label>
                                <input type="checkbox" /> Remember Me
                            </label>
                            <button
                                type="button"
                                className="link-button"
                                onClick={() => {
                                    setFormType('reset');
                                    setLoginStatus(null);
                                    setResetEmail('');
                                }}
                            >
                                Forgot password?
                            </button>
                        </div>
                        <button type="submit">Login</button>
                        <div className="register-link">
                            <p>
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={() => {
                                        setFormType('register');
                                        setLoginStatus(null);
                                        setRegisterData({ firstname: '', lastname: '', username: '', email: '', password: '' });
                                    }}
                                >
                                    Register
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            )}

            {/* REGISTRATION FORM */}
            {formType === 'register' && (
                <div className="form-box register">
                    <form onSubmit={handleRegister}>
                        <h1>REGISTRATION</h1>
                        {loginStatus && (
                            <p className={`status-message ${loginStatus.includes('successful') ? 'success' : 'error'}`}>
                                {loginStatus}
                            </p>
                        )}
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Firstname"
                                required
                                value={registerData.firstname}
                                onChange={(e) => setRegisterData({ ...registerData, firstname: e.target.value })}
                            />
                            <MdDriveFileRenameOutline className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Lastname"
                                required
                                value={registerData.lastname}
                                onChange={(e) => setRegisterData({ ...registerData, lastname: e.target.value })}
                            />
                            <MdDriveFileRenameOutline className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={registerData.username}
                                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                            />
                            <FaUserShield className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                            />
                            <MdAttachEmail className="icon" />
                        </div>
                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            />
                            <MdOutlineLockPerson className="icon" />
                        </div>

                        {/* Role selection */}
                        <div className="role-selection">
                            <label>Select role:</label>
                            <div className="roles">
                                <button
                                    type="button"
                                    className={role === 'learner' ? 'selected' : ''}
                                    onClick={() => setRole('learner')}
                                >
                                    <FaUserGraduate /> Learner
                                </button>
                                <button
                                    type="button"
                                    className={role === 'lecturer' ? 'selected' : ''}
                                    onClick={() => setRole('lecturer')}
                                >
                                    <FaChalkboardTeacher /> Lecturer
                                </button>
                                <button
                                    type="button"
                                    className={role === 'administrator' ? 'selected' : ''}
                                    onClick={() => setRole('administrator')}
                                >
                                    <FaUserCog /> Administrator
                                </button>
                            </div>
                        </div>

                        <div className="terms">
                            <label>
                                <input type="checkbox" required /> I agree to the terms and conditions.
                            </label>
                        </div>
                        <button type="submit">Register</button>
                        <div className="login-link">
                            <p>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={() => {
                                        setFormType('login');
                                        setLoginStatus(null);
                                        setLoginData({ username: '', password: '' });
                                    }}
                                >
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            )}

            {/* RESET PASSWORD FORM */}
            {formType === 'reset' && (
                <div className="form-box reset">
                    <form onSubmit={handleReset}>
                        <h1>RESET PASSWORD</h1>
                        {loginStatus && (
                            <p className={`status-message ${loginStatus.includes('sent') ? 'success' : 'error'}`}>
                                {loginStatus}
                            </p>
                        )}
                        <div className="input-box">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                required
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                            <MdAttachEmail className="icon" />
                        </div>
                        <button type="submit">Send Reset Link</button>
                        <div className="login-link">
                            <p>
                                Remembered your password?{' '}
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={() => {
                                        setFormType('login');
                                        setLoginStatus(null);
                                        setLoginData({ username: '', password: '' });
                                    }}
                                >
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default LoginRegister;
