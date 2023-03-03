import React, { useState, useEffect } from 'react';

const Exam = ({ kanjiData, numKanji, numStrokes, jlptLevel, kanjiGrade }) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const filteredKanji = kanjiData.filter((kanji) => {
    if (kanji.num_strokes === numStrokes && kanji.jlpt_new === jlptLevel && kanji.grade === kanjiGrade) {
      return true;
    }
    return false;
  });

  const selectedKanji = filteredKanji.slice(0, numKanji);
  const question = selectedKanji[questionIndex];

  const handleSubmit = (e) => {
    e.preventDefault();
    const isCorrect = question.meanings.includes(inputValue.trim().toLowerCase());
    setScore((prevScore) => (isCorrect ? prevScore + 1 : prevScore));
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
    setInputValue('');
    setQuestionIndex((prevIndex) => prevIndex + 1);
    setIsSubmitted(false);
  };

  useEffect(() => {
    if (questionIndex >= selectedKanji.length) {
      // Exam completed
      console.log(`Your final score is ${score}`);
    }
  }, [questionIndex, score, selectedKanji]);

  return (
    <div>
      <h1>Kanji Exam</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <p>Question {questionIndex + 1}</p>
          <p>{question.character}</p>
        </div>
        <div>
          <label htmlFor="meaning">Meaning:</label>
          <input
            type="text"
            id="meaning"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            maxLength="30"
          />
          {isSubmitted && (
            <p>{question.meanings.includes(inputValue.trim().toLowerCase()) ? 'Correct!' : 'Incorrect.'}</p>
          )}
        </div>
        <button type="submit" disabled={isSubmitted}>
          Submit
        </button>
        {isSubmitted && questionIndex !== selectedKanji.length - 1 && (
          <button type="button" onClick={handleNextQuestion}>
            Next
          </button>
        )}
      </form>
    </div>
  );
};

export default Exam;
