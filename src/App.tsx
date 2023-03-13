import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import  { Main }  from './pages/Main';
import { Login } from "./pages/Login";
import { Navbar } from "./components/navbar";
import './styles/App.css'
import { Learn } from './pages/Learn';
import Learned from './pages/Learned';
import Test from './pages/Test';

import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, provider, db } from "./config/firebase";
import { useEffect } from "react";

function App() {

  interface Kanji {
    character?: string;
    meanings?: string[];
    freq?: number;
    grade?: number;
    jlpt_new?: number;
    jlpt_old?: number;
    category?: string;
    strokes?: number;
    
  }
  
  const saveDataBeforeUnload = () => {
    const storedKanji = JSON.parse(sessionStorage.getItem("learnedKanjiArray") || "[]") as Kanji[];
    storedKanji.forEach((kanji: Kanji) => {
      handleSaveKanji(kanji);
    });   
  };
  
  const handleSaveKanji = async (kanji: Kanji) => {
    const currentUser = auth.currentUser?.uid;
    if (currentUser) {
      const learnedRef = collection(db, "users", currentUser, "learned");
      const docRef = doc(learnedRef, kanji.character);
      await setDoc(docRef, { kanji });
      console.log("aaaaa");
    }  

  };
  
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      saveDataBeforeUnload();
      event.preventDefault();
      event.returnValue = '';
      
      
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  
  
  return (
    
    <div className="App">
      
      <BrowserRouter>
      <Navbar />
        <Routes>

        <Route path="/" element={<Main />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Learn" element={<Learn />} />
        <Route path="/Learned" element={<Learned />} />
        <Route path="/Test" element={<Test />} />

        </Routes>
      
      </BrowserRouter>
      
    </div>
   
  )
}

export default App
