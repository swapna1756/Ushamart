import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBUUZxCD4dY88By0V6xuBtXUoZycnGo8Ds",
    authDomain: "usha-mart.firebaseapp.com",
    projectId: "usha-mart",
    storageBucket: "usha-mart.firebasestorage.app",
    messagingSenderId: "408234242361",
    appId: "1:408234242361:web:afc4a72c5ab5a2d578b8e8",
    measurementId: "G-X8CYTVTKXR"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

async function main() {
    const collections = ['categories', 'products', 'banners', 'pincodes', 'orders'];
    for (const c of collections) {
        const colRef = collection(firestore, c);
        const snapshot = await getDocs(colRef);
        console.log(`=== Collection: ${c} (${snapshot.size} docs) ===`);
        snapshot.forEach(doc => {
            console.log(doc.id, JSON.stringify(doc.data(), null, 2));
        });
    }
}

main().catch(console.error);
