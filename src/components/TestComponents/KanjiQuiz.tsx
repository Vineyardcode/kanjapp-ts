import React, { useState } from 'react';

const KanjiQuiz = ({ selectedK, currentQ }) => {



  return (
<div className='quiz1'>
  
  <ul>
    {selectedK.map((kanji) => (
      <button key={kanji.character} onClick={() => handleAsnwer(kanji)}>{kanji.character}</button>
    ))}
  </ul>

  <div>
    {currentQ && currentQ.meanings && (
      
      <label htmlFor={currentQ.character}>
                      {isAnswerCorrect !== null && (
            <div>
              {isAnswerCorrect ? 'Correct!' : `Wrong! The correct answer was ${currentQ.character}`}
            </div>
          )}
        {currentQ.meanings + ", "}
      </label>
        
    )}
  </div>
    
</div> 
  );

};

export default KanjiQuiz;
