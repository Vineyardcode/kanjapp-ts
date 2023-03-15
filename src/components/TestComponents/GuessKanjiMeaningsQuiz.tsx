import { useState, useEffect } from "react";

  interface GuessKanjiMeaningsQuizProps {
  currentQuestion: Kanji;
  questions: Kanji[];
  handleAnswer: (kanji: Kanji) => void;
  isAnswerCorrect: boolean;
  score: number;
  correctAnswer: Kanji;
  }

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

const GuessKanjiMeaningsQuiz = ({
    currentQuestion,
    questions,
    handleAnswer,
    isAnswerCorrect,
    score,
    correctAnswer,
  }: GuessKanjiMeaningsQuizProps) => {

  return (
    <div className="quiz2">
      <div className="question">
        <h2>What is the meaning of {currentQuestion?.character}?</h2>
        {isAnswerCorrect !== null && (
          <div className="answer-feedback">
            {isAnswerCorrect ? "Correct!" : (
                <>
                  What the fuck ?!
                  <br />
                  {correctAnswer.character} has the meaning of "{correctAnswer.meanings?.join(", ")}" !!!
                </>
              )}
          </div>
        )}
      </div>
      <div className='questions'>
          {questions.map((kanji: Kanji) => (
            <button 
            key={kanji.character} 
            onClick={() => handleAnswer(kanji)}>{kanji.meanings.join(", ")}</button>
          ))}
        </div>
      <div className="score">
        <p>Score: {score}</p>
      </div>
    </div>
  );
};

export default GuessKanjiMeaningsQuiz;