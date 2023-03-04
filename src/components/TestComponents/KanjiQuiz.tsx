import React, { useState } from 'react';

const KanjiQuiz = ({ kanjiData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(-1);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentQuestion = kanjiData[currentQuestionIndex];
  const answers = [...currentQuestion.meanings];
  const correctAnswerIndex = Math.floor(Math.random() * answers.length);
  answers.splice(correctAnswerIndex, 0, currentQuestion.meaning);

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswerIndex(answerIndex);
    setIsAnswerCorrect(answerIndex === correctAnswerIndex);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswerIndex(-1);
    setIsAnswerCorrect(null);
    setShowAnswer(false);
  };

  return (
    <div>
      <h2>Question {currentQuestionIndex + 1}</h2>
      <div className="kanji">{currentQuestion.kanji}</div>
      <div className="meanings">
        {answers.map((answer, index) => (
          <div key={index}>
            <input
              type="radio"
              id={`answer-${index}`}
              name="answer"
              value={answer}
              checked={selectedAnswerIndex === index}
              onChange={() => handleAnswerSelect(index)}
            />
            <label htmlFor={`answer-${index}`}>{answer}</label>
          </div>
        ))}
      </div>
      {showAnswer && (
        <div className={`answer ${isAnswerCorrect ? 'correct' : 'incorrect'}`}>
          {isAnswerCorrect ? 'Correct!' : 'Incorrect!'} The meaning of {currentQuestion.kanji} is "{currentQuestion.meaning}".
        </div>
      )}
      <button disabled={selectedAnswerIndex === -1} onClick={() => setShowAnswer(true)}>
        Show Answer
      </button>
      {showAnswer && (
        <button onClick={handleNextQuestion}>
          {currentQuestionIndex === kanjiData.length - 1 ? 'Finish' : 'Next Question'}
        </button>
      )}
    </div>
  );
};

export default KanjiQuiz;
