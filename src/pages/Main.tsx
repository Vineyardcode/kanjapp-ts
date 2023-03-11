//react
import React from 'react'
import { useState, useEffect } from 'react';

//redux toolkit
import { useDispatch, useSelector } from 'react-redux';
import { fetchKanji } from '../store/features/kanjiSlice';

//firestore
import { db, auth } from '../config/firebase';
import { doc, setDoc, collection, addDoc, getDocs } from "firebase/firestore";

//components
import ProgressBar from '../components/ProgressBar';


export const Main = () => {

  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);

  //fetch kanji from store
  const dispatch = useDispatch();
  const kanjiData = useSelector((state) => state.kanji.kanji);
  
  useEffect(() => {
    async function dispatchData() {
      await dispatch(fetchKanji());
    }
    dispatchData()
  }, [dispatch])

  //fetch the users "learned" kanji collection on user login 
  useEffect(() => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return; // Don't do anything if currentUser is not defined yet
    }
  
    const getKanjis = async () => {
      const kanjiArray = [];
  
      const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "learned"));
      querySnapshot.forEach((doc) => {
        const kanjiData = doc.data();
        kanjiArray.push(kanjiData.kanji);
      });
  
      setLearnedKanjiArray(kanjiArray);
    }
  
    getKanjis();
  }, [auth.currentUser]);

// First, count the total number of kanji in each category
const totalByJlpt = kanjiData.reduce((count, kanji) => {
  const jlpt = kanji.jlpt_new;
  count[jlpt] = (count[jlpt] || 0) + 1;
  return count;
}, {});

// Then, count the number of learned kanji in each category
const learnedByJlpt = learnedKanjiArray.reduce((count, kanji) => {
  const jlpt = kanji.jlpt_new;
  count[jlpt] = (count[jlpt] || 0) + 1;
  return count;
}, {});

// Finally, calculate the percentage of learned kanji in each category
const percentByJlpt = {};
Object.keys(totalByJlpt).forEach((jlpt) => {
  const total = totalByJlpt[jlpt];
  const learned = learnedByJlpt[jlpt] || 0;
  const percent = (learned / total) * 100 || 0;
  percentByJlpt[jlpt] = percent;
});


  



  return(
    <>
      <h1>Your stats:</h1>

      {Object.keys(percentByJlpt).map((jlpt) => (
        <div key={jlpt}>
          <h2>JLPT N{jlpt} kanji learned</h2>
          <ProgressBar percent={percentByJlpt[jlpt]} />
        </div>
      ))}
      
    </>
  );
};