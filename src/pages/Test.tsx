import React from 'react'
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchKanji } from '../store/features/kanjiSlice';

import KanjiQuiz from '../components/TestComponents/KanjiQuiz';

const Test = () => {

  const [numKanji, setNumKanji] = useState(9999);
  const [minStrokes, setMinStrokes] = useState(1);
  const [maxStrokes, setMaxStrokes] = useState(3);
  const [jlptLevel, setJlptLevel] = useState<string | number>('All');
  const [minGrade, setMinGrade] = useState(1);
  const [selectedKanji, setSelectedKanji] = useState<Kanji[]>([]);
  

  const [options, setOptions] = useState<Kanji[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState<Kanji | null>(null);
  const [usedKanji, setUsedKanji] = useState<Kanji[]>([]);

  const [score, setScore] = useState(0);

  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(null);


  //get kanji from store
  ///////////////////////////////////////////////////////////
  const dispatch = useDispatch();
  const kanjiData = useSelector((state) => state.kanji.kanji);
  
  useEffect(() => {
    async function dispatchData() {
      await dispatch(fetchKanji());
    }
    dispatchData()
  }, [dispatch])
  ///////////////////////////////////////////////////////////
  
  const handleNextQuestion = () => {
    // Select a random kanji from the list of selected kanji that hasn't been used before
    const unusedKanji = selectedKanji.filter(kanji => !usedKanji.includes(kanji));
    const nextKanji = unusedKanji[Math.floor(Math.random() * unusedKanji.length)];

    // Add the new kanji to the list of used kanji and set it as the new current question
    setUsedKanji([...usedKanji, nextKanji]);
    setCurrentQuestion(nextKanji);
    
    generateOptions()

  };

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

    generateOptions();

    const initialQuestion = selected[Math.floor(Math.random() * selected.length)];
    setUsedKanji([initialQuestion]);
    setCurrentQuestion(initialQuestion);   

  };
      
  // filter out selectedKanji characters from kanjiData and create options 
  const generateOptions = () => {
    const unselectedKanji = kanjiData.filter(
      (kanji) => !selectedKanji.includes(kanji)
    );
    const answerOptions = [];
    for (let i = 0; i < 6; i++) {
      const randIndex = Math.floor(Math.random() * unselectedKanji.length);
      answerOptions.push(unselectedKanji[randIndex]);
    }
    setOptions(answerOptions);
  };

  //quiz logic 
  const handleAsnwer = (selectedKanji: Kanji) => {

    if (selectedKanji.character === currentQuestion.character) {
      setScore(score + 1);
      setIsAnswerCorrect(true);
    } else {
      setIsAnswerCorrect(false);
    }

    handleNextQuestion()
    
  }



  useEffect(() => {
    if (isAnswerCorrect) {
      setTimeout(() => {
        setIsAnswerCorrect(null);
        
      }, 2000);
    } else {
      setTimeout(() => {
        setIsAnswerCorrect(null);
      }, 2000);
    }

    
  }, [isAnswerCorrect]);
  
  return (
    <>
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


    {/* <div className='quiz'>

<ul>
  {selectedKanji.map((kanji) => (
    <button key={kanji.character} onClick={() => handleAsnwer(kanji)}>{kanji.character}</button>
  ))}
</ul>

<div>
  {currentQuestion && currentQuestion.meanings && (
    
    <label htmlFor={currentQuestion.character}>
      {isAnswerCorrect !== null && (
        <div>
          {isAnswerCorrect ? 'Correct!' : `Wrong! The correct answer was ${currentQuestion.character}`}
        </div>
      )}
      {currentQuestion.meanings + ", "}
    </label>
      
  )}
  {!currentQuestion && (
    <div>
      Your score: {score}
    </div>
  )}
</div>
  
</div> */}

<div className='quiz2'>



  <div>
    {currentQuestion && currentQuestion.meanings && (
      
      <h1 htmlFor={currentQuestion.character}>
        {isAnswerCorrect !== null && (
          <div>
            {isAnswerCorrect ? 'Correct!' : `Wrong! The correct answer was ${currentQuestion.meanings}`}
          </div>
        )}
        {currentQuestion.character }
      </h1>
        
    )}
  </div>

  <ul>
    {selectedKanji.map((kanji) => (
      <button key={kanji.character} onClick={() => handleAsnwer(kanji)}>{kanji.meanings + ", "}</button>
    ))}
  </ul>

  {!currentQuestion && (
    <div>
      Your score: {score}
    </div>
  )}

  
</div>
    


  </>
  );
  };
  
  export default Test;














