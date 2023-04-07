

  interface GuessKanjiMeaningsQuizProps {
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

const GuessKanjiMeaningsQuiz = ({
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
  }: GuessKanjiMeaningsQuizProps) => {

  

  return (
    <div className="test">
    {isFinished ? (
      <div>
        
        <h2>You answered correctly {score} out of {numberOfQuestions} questions</h2>
        {/* <button onClick={handleGenerateKanji}>Restart test</button> */}
        
      </div>
      ) : (
      <div className="quiz2">
        <div className="question">
          <h2>What is the meaning of {currentQuestion?.character}?</h2>
          {isAnswerCorrect !== null && (
            <div className="answer-feedback">
              {isAnswerCorrect === true ? <b>Correct!</b> : (
                  <>          
                    <b>{angryQuote}</b>           
                    <div>
                    
                    <h4>{correctAnswer?.character} has the meaning of "{correctAnswer?.meanings?.join(", ")}"</h4>
                    </div>
                  </>
                )}
            </div>
          )}
        </div>
        <div className='answers'>
            {questions.map((kanji: Kanji) => (
              <button  style={{border: "1px solid black"}}
              key={kanji.character} 
              onClick={() => handleAnswer(kanji)}><h5>{kanji.meanings?.slice(0,3).join(", ")}</h5></button>
            ))}
          </div>
      </div>
    )}
    </div>
  );
};

export default GuessKanjiMeaningsQuiz;