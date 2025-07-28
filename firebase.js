import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDwcgaghJiK1c47rtGB0KO_zyP4YcqlZwA',
  authDomain: 'campusflow-d9a43.firebaseapp.com',
  projectId: 'campusflow-d9a43',
  storageBucket: 'campusflow-d9a43.firebasestorage.app',
  messagingSenderId: '878044548983',
  appId: '1:878044548983:android:ff1871d9ec94fcfee51b72',
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
