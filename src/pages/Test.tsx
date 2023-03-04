import React from 'react'
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchKanji } from '../store/features/kanjiSlice';
import KanjiQuiz from '../components/TestComponents/KanjiQuiz';


const Test = () => {

  const [numKanji, setNumKanji] = useState(21);
  const [minStrokes, setMinStrokes] = useState(1);
  const [maxStrokes, setMaxStrokes] = useState(20);
  const [jlptLevel, setJlptLevel] = useState<string | number>('All');
  const [minGrade, setMinGrade] = useState(1);
  const [selectedKanji, setSelectedKanji] = useState<Kanji[]>([]);



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
  // console.log(kanjiData[0]);
  
  const handleGenerateKanji = () => {
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
  };


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


       
    <ul>
      {selectedKanji.map((kanji) => (
        <li key={kanji.character}>{kanji.character}</li>
      ))}
    </ul>

      <div>

      {selectedKanji.length > 0 && (
  <div>
    <h2>Quiz:</h2>
    <p>{selectedKanji[0].character}</p>
  </div>
)}

      </div>

  </>
  );
  };
  
  export default Test;














