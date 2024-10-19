import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBgCCW34hRBuXkMWY24tiQ6k8TMFnqMipI",
    authDomain: "biletix-b25e3.firebaseapp.com",
    projectId: "biletix-b25e3",
    storageBucket: "biletix-b25e3.appspot.com",
    messagingSenderId: "1014592394965",
    appId: "1:1014592394965:web:f6c72d8b2bc5ded326745c"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {app};
export { auth };
export { db };
export { storage };