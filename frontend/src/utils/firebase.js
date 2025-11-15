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
    getDocs
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
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
};
