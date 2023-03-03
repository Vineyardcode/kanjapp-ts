import React, { useState } from 'react';



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

type Props = {
  kanji: Kanji;
  choices: string[];
  onSubmit: (answer: string) => void;
};

const KanjiQuestion = ({ kanji, choices, onSubmit }: Props) => {
  const [selectedChoice, setSelectedChoice] = useState('');

  const handleChoiceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedChoice(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(selectedChoice);
    setSelectedChoice('');
  };

  return (
    <div>
      <h2>{kanji.character}</h2>
      <form onSubmit={handleSubmit}>
        {choices.map((choice) => (
          <div key={choice}>
            <label>
              <input type="radio" value={choice} checked={selectedChoice === choice} onChange={handleChoiceChange} />
              {choice}
            </label>
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default KanjiQuestion;
