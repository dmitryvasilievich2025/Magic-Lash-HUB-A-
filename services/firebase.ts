import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User 
} from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, initializeFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Course } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyDWcDmZizbykQ-rRue9nV6Vi8XlZyRRdXk",
  authDomain: "magic-lash-hub-ai.firebaseapp.com",
  projectId: "magic-lash-hub-ai",
  storageBucket: "magic-lash-hub-ai.firebasestorage.app",
  messagingSenderId: "499356348838",
  appId: "1:499356348838:web:13645ccc786c91c80adf67",
  measurementId: "G-W6EVJDPMQ0"
};

// Створюємо єдиний екземпляр додатку
const app = initializeApp(firebaseConfig);

// Ініціалізуємо сервіси, передаючи app явно для усунення конфліктів реєстрації
export const auth = getAuth(app);
// Use initializeFirestore with experimentalForceLongPolling to avoid timeout issues in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);

// Безпечна ініціалізація аналітики
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

const googleProvider = new GoogleAuthProvider();

// СПИСОК СУПЕР-АДМІНІВ (HARDCODED)
// Додавайте сюди email-и тих, хто має мати повний доступ одразу після реєстрації
const ADMIN_EMAILS = [
  'dmitry.vasilievich@gmail.com'
  // 'another.admin@gmail.com',
];

/**
 * Встановлює тип збереження сесії
 * @param remember - true для browserLocalPersistence (зберігати після закриття), false для browserSessionPersistence
 */
export const setAuthPersistence = async (remember: boolean) => {
  try {
    const mode = remember ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, mode);
  } catch (error) {
    console.error("Persistence error:", error);
  }
};

/**
 * Синхронізує дані користувача між Auth та базою Firestore.
 */
export const syncUserProfile = async (user: User | null) => {
  if (!user) return null;
  
  const userRef = doc(db, "users", user.uid);
  let userSnap;
  
  try {
    userSnap = await getDoc(userRef);
  } catch (e) {
    console.error("Помилка доступу до профілю:", e);
    // Якщо не вдалося прочитати профіль (наприклад, немає інтернету),
    // повертаємо мінімальні дані з Auth
    return {
      uid: user.uid,
      email: user.email,
      role: 'student' // Fallback role
    };
  }

  // Перевіряємо, чи є email у списку супер-адмінів
  const isSuperAdmin = user.email ? ADMIN_EMAILS.includes(user.email) : false;
  
  if (!userSnap.exists()) {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: isSuperAdmin ? 'admin' : 'student',
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
      lastLogin: serverTimestamp(),
      displayName: user.displayName // Update name if changed
    };
    
    if (user.photoURL) {
        updates.photoURL = user.photoURL;
    }
    
    // Якщо користувач у списку ADMIN_EMAILS, примусово ставимо роль admin, навіть якщо в базі інше
    if (isSuperAdmin && existingData.role !== 'admin') {
      updates.role = 'admin';
    }
    
    try {
        await updateDoc(userRef, updates);
    } catch (e) {
        console.warn("Could not update last login", e);
    }
    return { ...existingData, ...updates };
  }
};

// --- EMAIL / PASSWORD AUTH METHODS ---

export const registerWithEmail = async (email: string, password: string, name: string, remember: boolean = true) => {
  await setAuthPersistence(remember);
  const result = await createUserWithEmailAndPassword(auth, email, password);
  // Оновлюємо профіль користувача, додаючи Ім'я
  await updateProfile(result.user, { displayName: name });
  // Синхронізуємо з Firestore
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
};

export const loginWithEmail = async (email: string, password: string, remember: boolean = true) => {
  await setAuthPersistence(remember);
  const result = await signInWithEmailAndPassword(auth, email, password);
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

// --- STORAGE ---

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

export const saveInvoiceToDB = async (invoice: any) => {
  try {
    const docRef = await addDoc(collection(db, "invoices"), {
      ...invoice,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Помилка збереження інвойсу:", e);
    throw e;
  }
};

export const updateInvoiceInDB = async (invoiceId: string, updates: any) => {
  const docRef = doc(db, "invoices", invoiceId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// --- COURSE MANAGEMENT ---

export const saveCourseToDB = async (course: Course) => {
  try {
    // Manually construct clean object to avoid circular refs from UI state pollution
    // This fixes "Converting circular structure to JSON" errors by ensuring only data is saved.
    const cleanCourse = {
        id: course.id,
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        currency: course.currency || 'USD',
        image: course.image || '',
        previewVideo: course.previewVideo || '',
        isExtensionCourse: course.isExtensionCourse || false,
        isPublished: course.isPublished ?? true,
        studentCount: course.studentCount || 0,
        sections: course.sections?.map(s => ({
            id: s.id,
            title: s.title,
            description: s.description || '',
            media: s.media || '',         // Added media for Section
            thumbnail: s.thumbnail || '', // Added thumbnail for Section
            lessons: s.lessons?.map(l => ({
                id: l.id,
                title: l.title,
                description: l.description || '',
                media: l.media || '',
                thumbnail: l.thumbnail || '',
                aiPrompt: l.aiPrompt || '',
                steps: l.steps?.map(st => ({
                    id: st.id,
                    title: st.title,
                    type: st.type,
                    description: st.description || '',
                    aiPrompt: st.aiPrompt || '',
                    videoPrompt: st.videoPrompt || '',         // Added videoPrompt
                    interactionPrompt: st.interactionPrompt || '', // Added interactionPrompt
                    media: st.media || '',
                    thumbnail: st.thumbnail || '', // Added thumbnail for Step
                    quizQuestions: st.quizQuestions?.map(q => ({
                      id: q.id,
                      question: q.question,
                      options: q.options || [],
                      correctOptionIndex: q.correctOptionIndex
                    })) || []
                })) || []
            })) || []
        })) || [],
        settings: {
          category: course.settings?.category || '',
          pace: course.settings?.pace || 'self-paced',
          timeLimitDays: course.settings?.timeLimitDays ?? null,
          accessMode: course.settings?.accessMode || 'linear',
          requireVideoWatch: course.settings?.requireVideoWatch || false,
          autoPlayNext: course.settings?.autoPlayNext || false,
          visibility: course.settings?.visibility || 'public',
          participationLimit: course.settings?.participationLimit ?? null,
        },
        team: course.team?.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          joinedAt: m.joinedAt
        })) || []
    };

    const courseRef = doc(db, "courses", course.id);
    await setDoc(courseRef, {
      ...cleanCourse,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error("Error saving course:", e);
    throw e;
  }
};

export const subscribeToCourses = (callback: (courses: Course[]) => void) => {
  const q = collection(db, "courses");
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    // Sort courses might be needed or handled in UI
    callback(courses);
  });
};
