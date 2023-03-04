import React from 'react'
import { useEffect, useState } from 'react';



const TestParams = (kanjiData: Kanji) => {

  const [numKanji, setNumKanji] = useState(5);
  const [minStrokes, setMinStrokes] = useState(1);
  const [maxStrokes, setMaxStrokes] = useState(20);
  const [jlptLevel, setJlptLevel] = useState(1);
  const [minGrade, setMinGrade] = useState(1);
  const [selectedKanji, setSelectedKanji] = useState<Kanji[]>([]);

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
  
  interface TestParams {
    numKanji: number;
    minStrokes: number;
    maxStrokes: number;
    jlptLevel: number;
    minGrade: number;
  }



  const handleGenerateKanji = (kanjiData) => {
    const filteredKanji = kanjiData.filter(
      (kanji) =>
        kanji.strokes >= minStrokes &&
        kanji.strokes <= maxStrokes &&
        kanji.jlpt_new === jlptLevel &&
        kanji.grade >= minGrade
    );
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
      
  </>
  );
  };
  
  export default TestParams;
