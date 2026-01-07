
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User 
} from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, initializeFirestore, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Course, Section, Invoice } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyDWcDmZizbykQ-rRue9nV6Vi8XlZyRRdXk",
  authDomain: "magic-lash-hub-ai.firebaseapp.com",
  projectId: "magic-lash-hub-ai",
  storageBucket: "magic-lash-hub-ai.firebasestorage.app",
  messagingSenderId: "499356348838",
  appId: "1:499356348838:web:13645ccc786c91c80adf67",
  measurementId: "G-W6EVJDPMQ0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAILS = [
  'dmitry.vasilievich@gmail.com'
];

export const setAuthPersistence = async (remember: boolean) => {
  try {
    const mode = remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, mode);
  } catch (error) {
    console.error("Persistence error:", error);
  }
};

export const syncUserProfile = async (user: User | null) => {
  if (!user) return null;
  
  const userRef = doc(db, "users", user.uid);
  let userSnap;
  
  try {
    userSnap = await getDoc(userRef);
  } catch (e) {
    console.error("Помилка доступу до профілю:", e);
    return {
      uid: user.uid,
      email: user.email,
      role: user.isAnonymous ? 'admin' : 'student' 
    };
  }

  const isSuperAdmin = user.email ? ADMIN_EMAILS.includes(user.email) : false;
  const isAnonymousAdmin = user.isAnonymous;

  if (!userSnap.exists()) {
    const userData = {
      uid: user.uid,
      email: user.email || 'anonymous',
      displayName: user.isAnonymous ? "Тимчасовий Адмін" : user.displayName,
      photoURL: user.photoURL,
      role: (isSuperAdmin || isAnonymousAdmin) ? 'admin' : 'student',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    try {
        await setDoc(userRef, userData);
    } catch (e) {
        console.error("Error creating user profile", e);
    }
    return userData;
  } else {
    const existingData = userSnap.data();
    const updates: any = { 
      lastLogin: serverTimestamp()
    };
    
    if (user.displayName) updates.displayName = user.displayName;
    if (user.photoURL) updates.photoURL = user.photoURL;
    
    if ((isSuperAdmin || isAnonymousAdmin) && existingData.role !== 'admin') {
      updates.role = 'admin';
    }
    
    try {
        await updateDoc(userRef, updates);
    } catch (e) {
        console.warn("Could not update user", e);
    }
    return { ...existingData, ...updates };
  }
};

export const registerWithEmail = async (email: string, password: string, name: string, remember: boolean = true) => {
  await setAuthPersistence(remember);
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

export const loginWithEmail = async (email: string, password: string, remember: boolean = true) => {
  await setAuthPersistence(remember);
  const result = await signInWithEmailAndPassword(auth, email, password);
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

export const loginAnonymously = async () => {
  await setAuthPersistence(false);
  const result = await signInAnonymously(auth);
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

export const loginWithGoogle = async (remember: boolean = true) => {
  try {
    await setAuthPersistence(remember);
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await syncUserProfile(result.user);
    return { user: result.user, profile };
  } catch (error: any) {
    console.error("Помилка входу:", error);
    if (error.code !== 'auth/popup-closed-by-user') {
      throw error;
    }
    return null;
  }
};

export const logout = () => signOut(auth);

export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

const cleanForFirestore = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = cleanForFirestore(value);
      }
    }
    return result;
  }
  return obj;
};

export const saveCourseToDB = async (course: Course) => {
  try {
    if (!course.id) {
       throw new Error("Course ID is missing");
    }
    const dataToSave = cleanForFirestore({
      ...course,
      updatedAt: serverTimestamp()
    });
    const courseRef = doc(db, "courses", course.id);
    await setDoc(courseRef, dataToSave, { merge: true });
    return true;
  } catch (e: any) {
    console.error("Firestore Error:", e);
    throw e;
  }
};

export const deleteCourseFromDB = async (courseId: string) => {
  try {
    const courseRef = doc(db, "courses", courseId);
    await deleteDoc(courseRef);
    return true;
  } catch (e: any) {
    console.error("Error deleting course:", e);
    throw e;
  }
};

export const saveInvoiceToDB = async (invoice: Partial<Invoice>) => {
  try {
    const invoicesRef = collection(db, "invoices");
    if (invoice.id) {
      const invRef = doc(db, "invoices", invoice.id);
      await setDoc(invRef, { ...invoice, updatedAt: serverTimestamp() }, { merge: true });
      return invoice.id;
    } else {
      const docRef = await addDoc(invoicesRef, {
        ...invoice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (e) {
    console.error("Error saving invoice:", e);
    throw e;
  }
};

export const updateInvoiceInDB = async (id: string, updates: Partial<Invoice>) => {
  try {
    const invRef = doc(db, "invoices", id);
    await updateDoc(invRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Error updating invoice:", e);
    throw e;
  }
};

export const subscribeToCourses = (callback: (courses: Course[]) => void) => {
  const q = collection(db, "courses");
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    callback(courses);
  }, (error) => {
    console.error("Subscription Error:", error);
  });
};
