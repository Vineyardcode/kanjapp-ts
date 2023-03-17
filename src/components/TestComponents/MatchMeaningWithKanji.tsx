import { useState, useEffect } from "react";

  interface MatchMeaningWithKanjiProps {
  currentQuestion: Kanji;
  questions: Kanji[];
  handleAnswer: (kanji: Kanji) => void;
  isAnswerCorrect: boolean;
  score: number;
  correctAnswer: Kanji;
  isFinished: boolean;
  angryQuote: string;
  numberOfQuestions: number;
  handleGenerateKanji: Event;
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
    angryQuote,
    isFinished,
    numberOfQuestions,
    handleGenerateKanji,
  }: MatchMeaningWithKanjiProps) => {





  return (

    <div>
    {isFinished ? (
      <div>
        <h2>You answered correctly {score} out of {numberOfQuestions} questions</h2>
        {/* <h1>{}</h1> */}
        {/* <button onClick={handleGenerateKanji}>Restart test</button> */}
      </div>
    ) : (

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
    </div>
      )}
    </div>
  );
};

export default MatchMeaningWithKanji;