import React from 'react';
import '../App.css';
import { motion, AnimatePresence } from 'framer-motion';
import WinterCanvas from './background/WinterCanvas';
import { API_BASE_URL } from '../config';

const GuestHome = ({ onLogin }) => {
    const [mode, setMode] = React.useState('welcome'); // welcome, login, signup
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                onLogin();
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (response.ok) {
                setMode('login');
                setError('Registration successful! Please login.');
                setUsername('');
                setPassword('');
                setConfirmPassword('');
            } else {
                const msg = await response.text();
                setError(msg || 'Signup failed');
            }
        } catch (err) {
            setError('Signup failed. Please try again.');
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, type: 'spring' } },
        exit: { opacity: 0, y: -50, scale: 0.9, transition: { duration: 0.3 } }
    };

    const inputStyle = {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(0,0,0,0.2)',
        color: 'white',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s'
    };

    const buttonStyle = {
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: 'var(--winter-accent)',
        color: '#0f172a',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '1rem',
        boxShadow: 'var(--winter-accent-glow)'
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
            <WinterCanvas />

            <div className="guest-container" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                zIndex: 10,
                position: 'relative',
                fontFamily: "'Inter', sans-serif"
            }}>
                <AnimatePresence mode="wait">
                    {mode === 'welcome' && (
                        <motion.div
                            key="welcome"
                            className="glass-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ padding: '4rem', borderRadius: '24px', textAlign: 'center' }}
                        >
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{ marginBottom: '1rem', fontSize: '4rem', fontWeight: '800', textShadow: '0 0 30px rgba(56, 189, 248, 0.6)' }}
                            >
                                Y-Lounge
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                style={{ marginBottom: '3rem', fontSize: '1.4rem', opacity: 0.95, fontWeight: '500' }}
                            >
                                Let's make a warm winter together in Y-Lounge
                            </motion.p>
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: "0 0 35px rgba(255, 255, 255, 0.6)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setMode('login')}
                                style={{
                                    ...buttonStyle,
                                    background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)',
                                    color: '#0f172a',
                                    padding: '18px 45px',
                                    fontSize: '1.2rem',
                                    borderRadius: '50px',
                                    border: '2px solid rgba(255,255,255,0.8)',
                                    fontWeight: '800'
                                }}
                            >
                                Enter the Lounge
                            </motion.button>
                        </motion.div>
                    )}

                    {mode === 'login' && (
                        <motion.div
                            key="login"
                            className="glass-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ padding: '3rem', borderRadius: '20px', width: '400px' }}
                        >
                            <h2 style={{ marginBottom: '2rem', textAlign: 'center', fontSize: '2rem' }}>Login</h2>
                            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <input style={inputStyle} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    style={buttonStyle}
                                >
                                    Log In
                                </motion.button>
                            </form>
                            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.8, cursor: 'pointer' }} onClick={() => { setMode('signup'); setError(''); }}>
                                Don't have an account? <span style={{ color: 'var(--winter-accent)', textDecoration: 'underline' }}>Sign up</span>
                            </p>
                        </motion.div>
                    )}

                    {mode === 'signup' && (
                        <motion.div
                            key="signup"
                            className="glass-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ padding: '3rem', borderRadius: '20px', width: '400px' }}
                        >
                            <h2 style={{ marginBottom: '2rem', textAlign: 'center', fontSize: '2rem' }}>Join Us</h2>
                            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <input style={inputStyle} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <input style={inputStyle} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    style={buttonStyle}
                                >
                                    Create Account
                                </motion.button>
                            </form>
                            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', opacity: 0.8, cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); }}>
                                Already have an account? <span style={{ color: 'var(--winter-accent)', textDecoration: 'underline' }}>Log in</span>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GuestHome;
