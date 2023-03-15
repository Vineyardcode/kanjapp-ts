import React from 'react'
import { useEffect, useState } from 'react';
import { setDoc, doc, collection, getDocs } from "firebase/firestore";
import { auth, provider, db } from "../config/firebase";
import "../styles/Test.css"
import GuessKanjiMeaningsQuiz from '../components/TestComponents/GuessKanjiMeaningsQuiz';
import MatchMeaningWithKanji from '../components/TestComponents/MatchMeaningWithKanji';

import joyo from "../kanjiData/joyo.json"
const Test = () => {

  const [numKanji, setNumKanji] = useState(9999);
  const [minStrokes, setMinStrokes] = useState(1);
  const [maxStrokes, setMaxStrokes] = useState(3);
  const [jlptLevel, setJlptLevel] = useState<string | number>('All');
  const [minGrade, setMinGrade] = useState(1);
  const [selectedKanji, setSelectedKanji] = useState<Kanji[]>([]);
  
  const [currentQuestion, setCurrentQuestion] = useState<Kanji | null>(null);
  const [usedKanji, setUsedKanji] = useState<Kanji[]>([]);

  const [correctAnswer, setCorrectAnswer] = useState<Kanji[]>([]);


  const [score, setScore] = useState(0);

  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(null);

  const [questions, setQuestions] = useState<Kanji[]>([]);

  const [kanjiData, setKanjiData] = useState(joyo); 

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
console.log(use);

  const handleGenerateKanji = () => {

    //create list of kanji
    let filteredKanji = kanjiData.filter(
      (kanji) =>
        kanji.strokes >= minStrokes &&
        kanji.strokes <= maxStrokes &&
        kanji.grade >= minGrade
    );
    if (jlptLevel !== "All") {
      filteredKanji = filteredKanji.filter(
        (kanji) => kanji.jlpt_new === jlptLevel
      );
    }
    const shuffledKanji = filteredKanji.sort(() => 0.5 - Math.random());
    const selected = shuffledKanji.slice(0, numKanji);
    
    setSelectedKanji(selected);
    
    const initialQuestion = selected[Math.floor(Math.random() * selected.length)];
    
    setCurrentQuestion(initialQuestion); 

    setUsedKanji([initialQuestion]);
    setScore(0)
    setCorrectAnswer(null)
  };

  const handleSaveKanji = async (kanji: Kanji) => { 

    const currentUser = auth.currentUser?.uid;
      if (currentUser) {
        const learnedRef = collection(db, "users", currentUser, "learned");
        const docRef = doc(learnedRef, kanji.character);
        await setDoc(docRef, { kanji });    
    }  

  };
      
  //quiz logic 
  const handleAnswer = (kanji: Kanji) => {
    if (kanji.character === currentQuestion.character) {
      setScore(score + 1);
      setIsAnswerCorrect(true);
      
      const prevScore = localStorage.getItem(kanji.character);
      if (prevScore) {
        localStorage.setItem(kanji.character, String(parseInt(prevScore) + 1));
        if (parseInt(prevScore) + 1 === 5) {
          handleSaveKanji(kanji)
          localStorage.removeItem(kanji.character);
          const learnedKanjiArray = JSON.parse(localStorage.getItem('learnedKanjiArray') || '[]');
          if (!learnedKanjiArray.some((k: Kanji) => k.character === kanji.character)) {
            learnedKanjiArray.push(kanji);
            localStorage.setItem("learnedKanjiArray", JSON.stringify(learnedKanjiArray));
          }
        }
      } else {
        localStorage.setItem(kanji.character, '1');
      }
    } else {
      setIsAnswerCorrect(false);
      setCorrectAnswer(currentQuestion)
    }
    handleNextQuestion();
  }


  const handleNextQuestion = () => {
    // Select a random kanji from the list of selected kanji that hasn't been used before
    const unusedKanji = selectedKanji.filter(kanji => !usedKanji.includes(kanji));
    const nextKanji = unusedKanji[Math.floor(Math.random() * unusedKanji.length)];

    // Add the new kanji to the list of used kanji and set it as the new current question
    setUsedKanji([...usedKanji, nextKanji]);
    setCurrentQuestion(nextKanji);
    
  };

  useEffect(() => {
    if (currentQuestion) {
      shuffleQuestions();
    }
  }, [currentQuestion]);

  const shuffleQuestions = () => {

    const kanjiWithoutCurrent = kanjiData.filter((kanji) => kanji !== currentQuestion);
    const shuffled = kanjiWithoutCurrent.sort(() => 0.5 - Math.random());

    const options = shuffled.slice(0, 8).concat(currentQuestion)
    const shuffledOptions = options.sort(() => 0.5 - Math.random());

    setQuestions(shuffledOptions)

  };

  return (
    <>
      <div className="params">
        <div>
          <label htmlFor="numKanji">Number of Kanji:</label>
          <input
          type="number"
          name="numKanji"
          value={numKanji}
          onChange={(e) => setNumKanji(Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="minStrokes">Minimum strokes:</label>
          <input
            type="number"
            name="minStrokes"
            value={minStrokes}
            onChange={(e) => setMinStrokes(Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="maxStrokes">Maximum strokes:</label>
          <input
            type="number"
            name="maxStrokes"
            value={maxStrokes}
            onChange={(e) => setMaxStrokes(Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="jlptLevel">JLPT level:</label>
          <select
            name="jlptLevel"
            value={jlptLevel}
            onChange={(e) => setJlptLevel(Number(e.target.value))}
          >
            <option value="">All</option>
            <option value={1}>N1</option>
            <option value={2}>N2</option>
            <option value={3}>N3</option>
            <option value={4}>N4</option>
            <option value={5}>N5</option>
            
          </select>
        </div>
        <div>
          <label htmlFor="minGrade">Minimum grade:</label>
          <select
          name="minGrade"
          value={minGrade}
          onChange={(e) => setMinGrade(Number(e.target.value))}
          >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
          <option value={8}>8</option>
          <option value={9}>9</option>
          </select>
        </div>
        <button onClick={handleGenerateKanji}>Generate Kanji</button>
      </div>

      {currentQuestion && (
      <GuessKanjiMeaningsQuiz
        currentQuestion={currentQuestion}
        questions={questions}
        handleAnswer={handleAnswer}
        isAnswerCorrect={isAnswerCorrect}
        correctAnswer={correctAnswer}
        score={score}
      />
        )}

      {/* {currentQuestion && (
      <MatchMeaningWithKanji
        currentQuestion={currentQuestion}
        questions={questions}
        handleAnswer={handleAnswer}
        isAnswerCorrect={isAnswerCorrect}
        correctAnswer={correctAnswer}
        score={score}
      />
        )} */}

  </>
  );
  };
  
  export default Test;














