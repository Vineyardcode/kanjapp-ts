//react
import React from 'react'
import { useState, useEffect } from 'react';

//firestore
import { db, auth } from '../config/firebase';
import { doc, setDoc, collection, addDoc, getDocs } from "firebase/firestore";

//components
import ProgressBar from '../components/ProgressBar';
import joyo from "../kanjiData/joyo.json"

export const Main = () => {

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
  const [kanjiData, setKanjiData] = useState(joyo);
  const [learnedKanjiArray, setLearnedKanjiArray] = useState<Kanji[]>([]);

  
  const readFromLocalStorage = () => {
    const storedKanji = localStorage.getItem("learnedKanjiArray");
    if (storedKanji) {
      const kanjiArray: Kanji[] = JSON.parse(storedKanji);
      setLearnedKanjiArray(kanjiArray);
    }
  };

  //kanji fetching
  useEffect(() => {
    readFromLocalStorage();
  }, []);

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