

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
    <div>
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
              {isAnswerCorrect === true ? "Correct!" : (
                  <>          
                    <b>{angryQuote}</b>           
                    <div>
                    <br/>
                    {correctAnswer?.character} has the meaning of "{correctAnswer?.meanings?.join(", ")}" !!!
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
              onClick={() => handleAnswer(kanji)}>{kanji.meanings.join(", ")}</button>
            ))}
          </div>
      </div>
    )}
    </div>
  );
};

export default GuessKanjiMeaningsQuiz;