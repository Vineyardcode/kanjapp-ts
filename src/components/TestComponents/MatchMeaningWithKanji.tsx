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
  handleGenerateKanji: any;
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

    <div className="test">
    {isFinished ? (
      <div>
        <h2>You answered correctly {score} out of {numberOfQuestions} questions</h2>
        {/* <h1>{}</h1> */}
        {/* <button onClick={handleGenerateKanji}>Restart test</button> */}
      </div>
    ) : (

    <div className="quiz2">
      <div className="question">
        <h2>Which kanji has the meaning of <strong>"{currentQuestion.meanings?.join(", ")}"</strong> ?</h2>
        {isAnswerCorrect !== null && (
          <div className="answer-feedback">
              {isAnswerCorrect === true ? <b>Correct!</b> : (
                <>          
                  <b>{angryQuote}</b>           
                  <div>
                  <br/>
                  <h4>Kanji for "{correctAnswer.meanings?.join(", ")}" is</h4><h2>{correctAnswer.character}</h2>
                  </div>
                </>
              )}
          </div>
        )}
      </div>
      <div className='answers'>
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