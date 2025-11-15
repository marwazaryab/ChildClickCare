import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    auth, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    onAuthStateChanged,
    findUserDocByUid
} from '../utils/firebase';
import './Auth.css';

function Signup() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

    const handleEmailSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            setError('Password should be at least 6 characters!');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User created:', userCredential.user);
            // Redirect to profile setup
            navigate('/profile');
        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'Error creating account. ';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage += 'An account with this email already exists.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage += 'Invalid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage += 'Password is too weak.';
            } else {
                errorMessage += error.message;
            }
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
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
            console.log('Signed up with Google:', result.user);

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
            console.error('Google sign-up error:', error);
            let errorMessage = 'Error signing up with Google. ';
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-up popup was closed.';
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
                    <h2>Create Your Account</h2>
                    <p className="auth-subtitle">Join LittleLog to get started</p>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleEmailSignup} className="auth-form">
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
                            placeholder="Create a password (min. 6 characters)"
                            minLength="6"
                        />
                        <span className="hint">Password must be at least 6 characters</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm your password"
                            minLength="6"
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <button 
                    type="button" 
                    className="auth-button google-button" 
                    onClick={handleGoogleSignup}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Sign up with Google
                </button>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
