import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    auth, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    onAuthStateChanged,
    findUserDocByUid
} from '../utils/firebase';
import './Auth.css';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    // Check if user is already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Redirect to profile if already logged in
                navigate('/profile');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Logged in:', userCredential.user);

            // Check if user has completed their profile
            const userDoc = await findUserDocByUid(userCredential.user.uid);
            if (!userDoc || !userDoc.exists()) {
                // No profile, redirect to profile setup
                navigate('/profile');
            } else {
                // Has profile, go to home
                navigate('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Error signing in. ';
            if (error.code === 'auth/user-not-found') {
                errorMessage += 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage += 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage += 'Invalid email address.';
            } else {
                errorMessage += error.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            provider.setCustomParameters({
                'prompt': 'select_account'
            });

            const result = await signInWithPopup(auth, provider);
            console.log('Logged in with Google:', result.user);

            // Check if user profile exists
            const userDoc = await findUserDocByUid(result.user.uid);
            if (!userDoc || !userDoc.exists()) {
                // New Google user, redirect to profile setup
                navigate('/profile');
            } else {
                // Existing user, go to home
                navigate('/');
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            let errorMessage = 'Error signing in with Google. ';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in popup was closed.';
            } else {
                errorMessage += error.message;
            }
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to your LittleLog account</p>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailLogin} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            minLength="6"
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <button 
                    type="button" 
                    className="auth-button google-button" 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                </button>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/signup" className="auth-link">Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
