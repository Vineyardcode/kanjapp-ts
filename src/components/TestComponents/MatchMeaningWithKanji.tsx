import { useState, useEffect } from "react";

  interface MatchMeaningWithKanjiProps {
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

const MatchMeaningWithKanji = ({
    currentQuestion,
    questions,
    handleAnswer,
    isAnswerCorrect,
    score,
    correctAnswer,
    angryQuote
  }: MatchMeaningWithKanjiProps) => {





  return (
    <div className="quiz2">
      <div className="question">
        <h2>Which kanji has the meaning of <strong>"{currentQuestion?.meanings.join(", ")}"</strong> ?</h2>
        {isAnswerCorrect !== null && (
          <div className="answer-feedback">
              {isAnswerCorrect === true ? "Correct!" : (
                <>          
                  <b>{angryQuote}</b>           
                  <div>
                  <br/>
                  Kanji for "{correctAnswer.meanings}" is <br /> <h2>{correctAnswer.character}</h2> !!!
                  </div>
                </>
              )}
          </div>
        )}
      </div>
      <div className='questions'>
          {questions.map((kanji: Kanji) => (
            <button 
            key={kanji.character} 
            onClick={() => handleAnswer(kanji)}><h1>{kanji.character}</h1></button>
          ))}
        </div>
      <div className="score">
        <p>Score: {score}</p>
      </div>
    </div>
  );
};

export default MatchMeaningWithKanji;