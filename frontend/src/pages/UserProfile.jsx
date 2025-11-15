import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    auth, 
    db, 
    onAuthStateChanged, 
    doc, 
    setDoc, 
    findUserDocByUid, 
    generateReadableDocId,
    signOut
} from '../utils/firebase';
import './UserProfile.css';

function UserProfile() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState(true); // Start in view mode if profile exists
    const [profileExists, setProfileExists] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthday: '',
        gender: '',
        location: '',
        preferredLanguage: 'English',
        numberOfChildren: 0,
        firstTimeParent: false
    });

    const [allergiesList, setAllergiesList] = useState([]);
    const [medicationsList, setMedicationsList] = useState([]);
    const [allergyInput, setAllergyInput] = useState('');
    const [medicationInput, setMedicationInput] = useState('');

    // Check authentication state and load existing profile
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                await loadExistingProfile(user.uid);
                setLoading(false);
            } else {
                // No user is signed in, redirect to login
                setLoading(false);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Load existing profile data if available
    const loadExistingProfile = async (userId) => {
        try {
            const userDoc = await findUserDocByUid(userId);

            if (userDoc && userDoc.exists()) {
                const profileData = userDoc.data();
                setIsEditing(true);
                setProfileExists(true);
                setViewMode(true); // Show view mode if profile exists

                // Populate form fields
                setFormData({
                    firstName: profileData.firstName || '',
                    lastName: profileData.lastName || '',
                    birthday: profileData.birthday || '',
                    gender: profileData.gender || '',
                    location: profileData.location || '',
                    preferredLanguage: profileData.preferredLanguage || 'English',
                    numberOfChildren: profileData.numberOfChildren || 0,
                    firstTimeParent: profileData.firstTimeParent || false
                });

                // Load allergies and medications
                if (profileData.allergies && profileData.allergies.length > 0) {
                    setAllergiesList(profileData.allergies);
                }
                if (profileData.medications && profileData.medications.length > 0) {
                    setMedicationsList(profileData.medications);
                }
            } else {
                setViewMode(false); // Show edit mode if no profile exists
            }
        } catch (error) {
            console.error('Error loading existing profile:', error);
        }
    };

    // Calculate age from birthday
    const calculateAge = (birthday) => {
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    // Handle tag input for allergies
    const handleAllergyKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = allergyInput.trim();
            if (value && !allergiesList.includes(value)) {
                setAllergiesList([...allergiesList, value]);
                setAllergyInput('');
            }
        }
    };

    // Handle tag input for medications
    const handleMedicationKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = medicationInput.trim();
            if (value && !medicationsList.includes(value)) {
                setMedicationsList([...medicationsList, value]);
                setMedicationInput('');
            }
        }
    };

    // Remove allergy tag
    const removeAllergy = (allergy) => {
        setAllergiesList(allergiesList.filter(a => a !== allergy));
    };

    // Remove medication tag
    const removeMedication = (medication) => {
        setMedicationsList(medicationsList.filter(m => m !== medication));
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        if (!currentUser) {
            setError('You must be logged in to complete your profile');
            setSubmitting(false);
            return;
        }

        // Validate required fields
        if (!formData.firstName.trim()) {
            setError('Please enter your first name');
            setSubmitting(false);
            return;
        }

        if (!formData.lastName.trim()) {
            setError('Please enter your last name');
            setSubmitting(false);
            return;
        }

        if (!formData.birthday) {
            setError('Please enter your birthday');
            setSubmitting(false);
            return;
        }

        // Validate birthday is not in the future
        const birthDate = new Date(formData.birthday);
        const today = new Date();
        if (birthDate > today) {
            setError('Birthday cannot be in the future');
            setSubmitting(false);
            return;
        }

        // Calculate age
        const age = calculateAge(formData.birthday);

        // Validate age is reasonable
        if (age < 0 || age > 150) {
            setError('Please enter a valid birthday');
            setSubmitting(false);
            return;
        }

        // Generate readable document ID from name
        const readableDocId = generateReadableDocId(
            formData.firstName, 
            formData.lastName, 
            currentUser.uid
        );

        // Create profile data object
        const profileData = {
            authUid: currentUser.uid,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            birthday: formData.birthday,
            age,
            gender: formData.gender || null,
            location: formData.location.trim() || null,
            preferredLanguage: formData.preferredLanguage,
            numberOfChildren: parseInt(formData.numberOfChildren) || 0,
            firstTimeParent: formData.firstTimeParent,
            allergies: allergiesList,
            medications: medicationsList,
            childrenIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            // Check if profile already exists (by UID)
            const existingDoc = await findUserDocByUid(currentUser.uid);
            const docIdToUse = existingDoc && existingDoc.exists() ? existingDoc.id : readableDocId;

            // Save to Firestore
            const userDocRef = doc(db, 'users', docIdToUse);
            await setDoc(userDocRef, profileData);

            setProfileExists(true);
            setViewMode(true); // Switch to view mode after saving
            setIsEditing(true);
            
            alert(isEditing ? 'Profile updated successfully!' : 'Profile completed successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            let errorMsg = 'Error saving profile: ' + error.message;
            if (error.code === 'permission-denied') {
                errorMsg = 'Permission denied. Please check your Firestore security rules.';
            } else if (error.code === 'unavailable') {
                errorMsg = 'Firestore is unavailable. Please check your internet connection.';
            }
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Calculate age for display
    const displayAge = formData.birthday ? calculateAge(formData.birthday) : null;

    // Get user initials for avatar
    const getInitials = () => {
        const first = formData.firstName ? formData.firstName.charAt(0).toUpperCase() : '';
        const last = formData.lastName ? formData.lastName.charAt(0).toUpperCase() : '';
        return first + last || 'U';
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Error signing out: ' + error.message);
        }
    };

    // Render profile display view
    const renderProfileView = () => (
        <div className="profile-view-wrapper">
            {/* Profile Header with Avatar */}
            <div className="profile-header-section">
                <div className="profile-avatar">
                    <span className="avatar-initials">{getInitials()}</span>
                </div>
                <div className="profile-header-info">
                    <h1 className="profile-name">
                        {formData.firstName && formData.lastName 
                            ? `${formData.firstName} ${formData.lastName}` 
                            : 'User Profile'}
                    </h1>
                    {formData.location && (
                        <p className="profile-location">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {formData.location}
                        </p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="profile-actions">
                <button 
                    type="button" 
                    className="edit-profile-button"
                    onClick={() => setViewMode(false)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit Profile
                </button>
                <button 
                    type="button" 
                    className="logout-button"
                    onClick={handleLogout}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                </button>
            </div>

            {/* Profile Information Sections */}
            <div className="profile-content-grid">
                {/* Personal Information Card */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <h3>Personal Information</h3>
                    </div>
                    <div className="profile-card-content">
                        <div className="profile-info-item">
                            <span className="info-label">Full Name</span>
                            <span className="info-value">
                                {formData.firstName && formData.lastName 
                                    ? `${formData.firstName} ${formData.lastName}` 
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Birthday</span>
                            <span className="info-value">{formatDate(formData.birthday)}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Age</span>
                            <span className="info-value">{displayAge !== null ? `${displayAge} years old` : 'N/A'}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Gender</span>
                            <span className="info-value">
                                {formData.gender 
                                    ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
                                    : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Location & Language Card */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <h3>Location & Language</h3>
                    </div>
                    <div className="profile-card-content">
                        <div className="profile-info-item">
                            <span className="info-label">Location</span>
                            <span className="info-value">{formData.location || 'N/A'}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Preferred Language</span>
                            <span className="info-value">{formData.preferredLanguage || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Family Information Card */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <h3>Family Information</h3>
                    </div>
                    <div className="profile-card-content">
                        <div className="profile-info-item">
                            <span className="info-label">Number of Children</span>
                            <span className="info-value">{formData.numberOfChildren || 0}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">First Time Parent</span>
                            <span className="info-value">
                                <span className={`badge ${formData.firstTimeParent ? 'badge-yes' : 'badge-no'}`}>
                                    {formData.firstTimeParent ? 'Yes' : 'No'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Health Information Card */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <h3>Health Information</h3>
                    </div>
                    <div className="profile-card-content">
                        <div className="profile-info-item">
                            <span className="info-label">Allergies</span>
                            <span className="info-value">
                                {allergiesList.length > 0 ? (
                                    <div className="tags-list">
                                        {allergiesList.map((allergy, index) => (
                                            <span key={index} className="tag-badge">{allergy}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="info-empty">None</span>
                                )}
                            </span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Medications</span>
                            <span className="info-value">
                                {medicationsList.length > 0 ? (
                                    <div className="tags-list">
                                        {medicationsList.map((medication, index) => (
                                            <span key={index} className="tag-badge">{medication}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="info-empty">None</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="user-profile-container">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    // Show view mode if profile exists and we're in view mode
    if (viewMode && profileExists) {
        return (
            <div className="user-profile-container">
                {renderProfileView()}
            </div>
        );
    }

    // Otherwise show edit form
    return (
        <div className="user-profile-container">
            <div className="profile-form-wrapper">
                <h2>{isEditing ? 'Edit Your Profile' : 'Complete Your Profile'}</h2>
                <p className="intro-text">
                    {isEditing 
                        ? 'Update your profile information below.' 
                        : 'Help us personalize your experience by completing your profile information.'}
                </p>

                {!currentUser && (
                    <div className="error-message show" style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fbbf24' }}>
                        ⚠️ You need to be logged in to save your profile. The form is available for viewing, but you'll need to authenticate to save changes.
                    </div>
                )}

                {error && (
                    <div className="error-message show">
                        {error}
                    </div>
                )}

                <form id="profileForm" onSubmit={handleSubmit}>
                    {/* Personal Information Section */}
                    <div className="form-section">
                        <div className="form-section-title">Personal Information</div>
                        <div className="form-group">
                            <label htmlFor="firstName">First Name *</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name *</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="birthday">Birthday *</label>
                            <input
                                type="date"
                                id="birthday"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleInputChange}
                                required
                            />
                            <span className="hint">Age will be calculated automatically</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="gender">Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                            >
                                <option value="">Prefer not to say</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Location & Language Section */}
                    <div className="form-section">
                        <div className="form-section-title">Location & Language</div>
                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="City, Province/State"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="preferredLanguage">Preferred Language</label>
                            <select
                                id="preferredLanguage"
                                name="preferredLanguage"
                                value={formData.preferredLanguage}
                                onChange={handleInputChange}
                            >
                                <option value="English">English</option>
                                <option value="French">French</option>
                                <option value="Spanish">Spanish</option>
                                <option value="Mandarin">Mandarin</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Family Information Section */}
                    <div className="form-section">
                        <div className="form-section-title">Family Information</div>
                        <div className="form-group">
                            <label htmlFor="numberOfChildren">Number of Children</label>
                            <input
                                type="number"
                                id="numberOfChildren"
                                name="numberOfChildren"
                                value={formData.numberOfChildren}
                                onChange={handleInputChange}
                                min="0"
                            />
                        </div>

                        <div className="checkbox-group">
                            <input
                                type="checkbox"
                                id="firstTimeParent"
                                name="firstTimeParent"
                                checked={formData.firstTimeParent}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="firstTimeParent">I am a first-time parent</label>
                        </div>
                    </div>

                    {/* Health Information Section */}
                    <div className="form-section">
                        <div className="form-section-title">Health Information</div>
                        <div className="form-group full-width">
                            <label>Allergies</label>
                            <div className="tags-input">
                                {allergiesList.map((allergy, index) => (
                                    <div key={index} className="tag">
                                        {allergy}
                                        <span className="remove" onClick={() => removeAllergy(allergy)}>
                                            &times;
                                        </span>
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    id="allergiesInput"
                                    placeholder="Type and press Enter"
                                    value={allergyInput}
                                    onChange={(e) => setAllergyInput(e.target.value)}
                                    onKeyDown={handleAllergyKeyDown}
                                />
                            </div>
                            <span className="hint">Press Enter after each allergy to add it</span>
                        </div>

                        <div className="form-group full-width">
                            <label>Medications</label>
                            <div className="tags-input">
                                {medicationsList.map((medication, index) => (
                                    <div key={index} className="tag">
                                        {medication}
                                        <span className="remove" onClick={() => removeMedication(medication)}>
                                            &times;
                                        </span>
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    id="medicationsInput"
                                    placeholder="Type and press Enter"
                                    value={medicationInput}
                                    onChange={(e) => setMedicationInput(e.target.value)}
                                    onKeyDown={handleMedicationKeyDown}
                                />
                            </div>
                            <span className="hint">Press Enter after each medication to add it</span>
                        </div>
                    </div>

                    <button type="submit" disabled={submitting || !currentUser}>
                        {!currentUser 
                            ? 'Please log in to save' 
                            : submitting 
                                ? 'Saving...' 
                                : (isEditing ? 'Update Profile' : 'Complete Profile')}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default UserProfile;
