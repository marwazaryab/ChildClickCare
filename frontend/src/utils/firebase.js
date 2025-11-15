import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBASzMHJY-37iMzuwtZGKEcGctzj85YqOk",
    authDomain: "wiehackathon-db039.firebaseapp.com",
    projectId: "wiehackathon-db039",
    storageBucket: "wiehackathon-db039.firebasestorage.app",
    messagingSenderId: "103074057836",
    appId: "1:103074057836:web:4931c0ddb202afeacf1249",
    measurementId: "G-MT2P76W7P6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to generate a readable document ID from name
export function generateReadableDocId(firstName, lastName, uid) {
    // Create base name: firstName_lastName (lowercase, spaces/special chars removed)
    const baseName = `${firstName}_${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .replace(/\s+/g, '_');
    
    // Use base name with a short unique suffix from UID (first 8 chars)
    // This ensures uniqueness while keeping it readable
    const uniqueSuffix = uid.substring(0, 8);
    return `${baseName}_${uniqueSuffix}`;
}

// Helper function to find user document by UID
export async function findUserDocByUid(uid) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('authUid', '==', uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Return the first matching document
            return querySnapshot.docs[0];
        }
        return null;
    } catch (error) {
        console.error('Error finding user by UID:', error);
        return null;
    }
}

// Helper functions for emergency contacts subcollection
export async function getEmergencyContacts(userDocId) {
    try {
        const emergencyRef = collection(db, 'users', userDocId, 'emergency');
        const querySnapshot = await getDocs(emergencyRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting emergency contacts:', error);
        return [];
    }
}

export async function addEmergencyContact(userDocId, contactData) {
    try {
        console.log('Adding emergency contact:', { userDocId, contactData });
        const emergencyRef = collection(db, 'users', userDocId, 'emergency');
        console.log('Emergency ref path:', emergencyRef.path);
        const docRef = await addDoc(emergencyRef, {
            ...contactData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        console.log('Emergency contact added successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding emergency contact:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
    }
}

export async function updateEmergencyContact(userDocId, contactId, contactData) {
    try {
        const contactRef = doc(db, 'users', userDocId, 'emergency', contactId);
        await updateDoc(contactRef, {
            ...contactData,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating emergency contact:', error);
        throw error;
    }
}

export async function deleteEmergencyContact(userDocId, contactId) {
    try {
        const contactRef = doc(db, 'users', userDocId, 'emergency', contactId);
        await deleteDoc(contactRef);
    } catch (error) {
        console.error('Error deleting emergency contact:', error);
        throw error;
    }
}

// Helper functions for child profiles subcollection
export async function getChildProfiles(userDocId) {
    try {
        const childProfileRef = collection(db, 'users', userDocId, 'childProfile');
        const querySnapshot = await getDocs(childProfileRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting child profiles:', error);
        return [];
    }
}

export async function addChildProfile(userDocId, childData) {
    try {
        console.log('Adding child profile:', { userDocId, childData });
        const childProfileRef = collection(db, 'users', userDocId, 'childProfile');
        const docRef = await addDoc(childProfileRef, {
            ...childData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        // Update parent's childrenIds array
        const userDocRef = doc(db, 'users', userDocId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const currentChildrenIds = userDoc.data().childrenIds || [];
            await updateDoc(userDocRef, {
                childrenIds: [...currentChildrenIds, docRef.id],
                updatedAt: new Date().toISOString()
            });
        }
        
        console.log('Child profile added successfully:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding child profile:', error);
        throw error;
    }
}

export async function updateChildProfile(userDocId, childId, childData) {
    try {
        const childRef = doc(db, 'users', userDocId, 'childProfile', childId);
        await updateDoc(childRef, {
            ...childData,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating child profile:', error);
        throw error;
    }
}

export async function deleteChildProfile(userDocId, childId) {
    try {
        const childRef = doc(db, 'users', userDocId, 'childProfile', childId);
        await deleteDoc(childRef);
        
        // Remove from parent's childrenIds array
        const userDocRef = doc(db, 'users', userDocId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const currentChildrenIds = userDoc.data().childrenIds || [];
            await updateDoc(userDocRef, {
                childrenIds: currentChildrenIds.filter(id => id !== childId),
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error deleting child profile:', error);
        throw error;
    }
}

// Export auth and db for use in other files
export { 
    auth, 
    db, 
    signOut, 
    onAuthStateChanged, 
    doc, 
    setDoc, 
    getDoc, 
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
};
