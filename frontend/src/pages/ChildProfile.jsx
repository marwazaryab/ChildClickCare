import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    auth, 
    db, 
    onAuthStateChanged, 
    findUserDocByUid,
    getChildProfiles,
    addChildProfile,
    updateChildProfile,
    deleteChildProfile
} from '../utils/firebase';
import './UserProfile.css';

function ChildProfile() {
    const navigate = useNavigate();
    const { childId } = useParams();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [userDocId, setUserDocId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthday: '',
        gender: '',
        age: '',
        height: '',
        allergies: [],
        medications: [],
        existingConditions: '',
        emergencyNotes: ''
    });

    const [allergiesList, setAllergiesList] = useState([]);
    const [medicationsList, setMedicationsList] = useState([]);
    const [allergyInput, setAllergyInput] = useState('');
    const [medicationInput, setMedicationInput] = useState('');

    // Check authentication state and load existing child profile
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                const userDoc = await findUserDocByUid(user.uid);
                if (userDoc && userDoc.exists()) {
                    setUserDocId(userDoc.id);
                    if (childId) {
                        await loadChildProfile(userDoc.id, childId);
                    } else {
                        setViewMode(false);
                        setIsEditing(false);
                    }
                }
                setLoading(false);
            } else {
                setLoading(false);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate, childId]);

    // Load existing child profile data
    const loadChildProfile = async (docId, id) => {
        try {
            const children = await getChildProfiles(docId);
            const child = children.find(c => c.id === id);
            
            if (child) {
                setIsEditing(true);
                setViewMode(true);
                
                setFormData({
                    firstName: child.firstName || '',
                    lastName: child.lastName || '',
                    birthday: child.birthday || '',
                    gender: child.gender || '',
                    age: child.age || '',
                    height: child['height(cm)'] || '',
                    existingConditions: child.existingConditions || '',
                    emergencyNotes: child.emergencyNotes || ''
                });

                if (child.allergies && child.allergies.length > 0) {
                    setAllergiesList(child.allergies.filter(a => a));
                }
                if (child.medications && child.medications.length > 0) {
                    setMedicationsList(child.medications.filter(m => m));
                }
            } else {
                setViewMode(false);
            }
        } catch (error) {
            console.error('Error loading child profile:', error);
            setError('Error loading child profile: ' + error.message);
        }
    };

    // Calculate age from birthday
    const calculateAge = (birthday) => {
        if (!birthday) return null;
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

        if (!currentUser || !userDocId) {
            setError('You must be logged in to save child profile');
            setSubmitting(false);
            return;
        }

        // Validate required fields
        if (!formData.firstName.trim()) {
            setError('Please enter the child\'s first name');
            setSubmitting(false);
            return;
        }

        if (!formData.lastName.trim()) {
            setError('Please enter the child\'s last name');
            setSubmitting(false);
            return;
        }

        // Calculate age if birthday is provided
        let age = formData.age;
        if (formData.birthday) {
            const calculatedAge = calculateAge(formData.birthday);
            if (calculatedAge !== null) {
                age = calculatedAge;
            }
        }

        // Prepare child data
        const childData = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            birthday: formData.birthday || '',
            gender: formData.gender || '',
            age: age ? parseInt(age) : null,
            'height(cm)': formData.height ? parseInt(formData.height) : null,
            allergies: allergiesList.length > 0 ? allergiesList : [''],
            medications: medicationsList.length > 0 ? medicationsList : [''],
            existingConditions: formData.existingConditions.trim() || '',
            emergencyNotes: formData.emergencyNotes.trim() || ''
        };

        try {
            if (isEditing && childId) {
                // Update existing child profile
                await updateChildProfile(userDocId, childId, childData);
                alert('Child profile updated successfully!');
            } else {
                // Add new child profile
                await addChildProfile(userDocId, childData);
                alert('Child profile added successfully!');
                navigate('/profile');
            }

            setViewMode(true);
            setIsEditing(true);
            
            // Reload if editing
            if (childId) {
                await loadChildProfile(userDocId, childId);
            }
        } catch (error) {
            console.error('Error saving child profile:', error);
            let errorMsg = 'Error saving child profile: ' + error.message;
            if (error.code === 'permission-denied') {
                errorMsg = 'Permission denied. Please check your Firestore security rules.';
            }
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this child profile? This action cannot be undone.')) {
            return;
        }

        if (!userDocId || !childId) {
            return;
        }

        try {
            await deleteChildProfile(userDocId, childId);
            alert('Child profile deleted successfully!');
            navigate('/profile');
        } catch (error) {
            console.error('Error deleting child profile:', error);
            alert('Error deleting child profile: ' + error.message);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Get child initials for avatar
    const getInitials = () => {
        const first = formData.firstName ? formData.firstName.charAt(0).toUpperCase() : '';
        const last = formData.lastName ? formData.lastName.charAt(0).toUpperCase() : '';
        return first + last || 'C';
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
                            : 'Child Profile'}
                    </h1>
                    {formData.age && (
                        <p className="profile-location">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            {formData.age} years old
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
                {childId && (
                    <button 
                        type="button" 
                        className="logout-button"
                        onClick={handleDelete}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete Profile
                    </button>
                )}
                <button 
                    type="button" 
                    className="logout-button"
                    onClick={() => navigate('/profile')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"></path>
                    </svg>
                    Back to Profile
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
                            <span className="info-value">{formData.age ? `${formData.age} years old` : 'N/A'}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Gender</span>
                            <span className="info-value">
                                {formData.gender 
                                    ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Height</span>
                            <span className="info-value">{formData.height ? `${formData.height} cm` : 'N/A'}</span>
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
                        <div className="profile-info-item">
                            <span className="info-label">Existing Conditions</span>
                            <span className="info-value">{formData.existingConditions || 'N/A'}</span>
                        </div>
                        <div className="profile-info-item">
                            <span className="info-label">Emergency Notes</span>
                            <span className="info-value">{formData.emergencyNotes || 'N/A'}</span>
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
    if (viewMode && isEditing) {
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
                <h2>{isEditing ? 'Edit Child Profile' : 'Add Child Profile'}</h2>
                <p className="intro-text">
                    {isEditing 
                        ? 'Update your child\'s profile information below.' 
                        : 'Add a new child profile to track their health information and milestones.'}
                </p>

                {error && (
                    <div className="error-message show">
                        {error}
                    </div>
                )}

                <form id="childProfileForm" onSubmit={handleSubmit}>
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
                            <label htmlFor="birthday">Birthday</label>
                            <input
                                type="date"
                                id="birthday"
                                name="birthday"
                                value={formData.birthday}
                                onChange={handleInputChange}
                            />
                            <span className="hint">Age will be calculated automatically</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="age">Age (years)</label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                min="0"
                                max="18"
                            />
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

                        <div className="form-group">
                            <label htmlFor="height">Height (cm)</label>
                            <input
                                type="number"
                                id="height"
                                name="height"
                                value={formData.height}
                                onChange={handleInputChange}
                                min="0"
                                placeholder="e.g., 45"
                            />
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

                        <div className="form-group">
                            <label htmlFor="existingConditions">Existing Conditions</label>
                            <textarea
                                id="existingConditions"
                                name="existingConditions"
                                value={formData.existingConditions}
                                onChange={handleInputChange}
                                placeholder="Any existing medical conditions"
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="emergencyNotes">Emergency Notes</label>
                            <textarea
                                id="emergencyNotes"
                                name="emergencyNotes"
                                value={formData.emergencyNotes}
                                onChange={handleInputChange}
                                placeholder="Important notes for emergency situations"
                                rows="3"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button 
                            type="button"
                            onClick={() => childId ? setViewMode(true) : navigate('/profile')}
                            style={{
                                padding: '13px 28px',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                border: 'none',
                                borderRadius: '12px',
                                background: 'rgba(148, 163, 184, 0.2)',
                                color: '#64748b',
                                fontFamily: 'inherit'
                            }}
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting || !currentUser} style={{ flex: 1 }}>
                            {submitting 
                                ? 'Saving...' 
                                : (isEditing ? 'Update Profile' : 'Add Child Profile')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChildProfile;
