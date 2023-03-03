import React from 'react'
import { useEffect, useState } from 'react';
import Exam from '../components/TestComponents/Exam';


const TestParams = ({}) => {


const [testParams, setTestParams] = useState({
  kanjiCount: '',
  strokeCount: '',
  jlptLevel: '',
  gradeLevel: '',
});
const [testKanji, setTestKanji] = useState([]);

const handleParamsChange = (e) => {
  setTestParams({
    ...testParams,
    [e.target.name]: e.target.value,
  });
};

const handleSubmit = (e) => {
  e.preventDefault();
  // Filter kanji based on test params
  const filteredKanji = kanjiData.filter((kanji) => {
    return (
      (!testParams.kanjiCount ||
        parseInt(testParams.kanjiCount) === kanji.character.length) &&
      (!testParams.strokeCount ||
        parseInt(testParams.strokeCount) === kanji.strokes) &&
      (!testParams.jlptLevel ||
        parseInt(testParams.jlptLevel) === kanji.jlpt_new) &&
      (!testParams.gradeLevel ||
        parseInt(testParams.gradeLevel) === kanji.grade)
    );
  });
  // Shuffle filtered kanji and set as test kanji
  setTestKanji(shuffleArray(filteredKanji));
};

// Helper function to shuffle array
const shuffleArray = (arr) => {
  const shuffledArr = [...arr];
  for (let i = shuffledArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
  }
  return shuffledArr;
};


return (
  <div>
  <h2>Take a Kanji Test</h2>
  <form onSubmit={handleSubmit}>
    <label>
      Number of Kanji:
      <input
        type="number"
        name="kanjiCount"
        value={testParams.kanjiCount}
        onChange={handleParamsChange}
      />
    </label>
    <label>
      Number of Strokes:
      <input
        type="number"
        name="strokeCount"
        value={testParams.strokeCount}
        onChange={handleParamsChange}
      />
    </label>
    <label>
      JLPT Level:
      <input
        type="number"
        name="jlptLevel"
        value={testParams.jlptLevel}
        onChange={handleParamsChange}
      />
    </label>
    <label>
      Grade Level:
      <input
        type="number"
        name="gradeLevel"
        value={testParams.gradeLevel}
        onChange={handleParamsChange}
      />
    </label>
    <button type="submit">Start Test</button>
  </form>
  {testKanji.length > 0 && (
    <Exam testKanji={testKanji} />
  )}
</div>
)

}

export default TestParams