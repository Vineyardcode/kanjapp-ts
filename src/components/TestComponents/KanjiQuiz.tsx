import React, { useState, useEffect } from "react";

type Props = {
  options: Kanji[];
};

const KanjiQuiz: React.FC<Props> = ({ options }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<number>(0);
  const [currentKanji, setCurrentKanji] = useState<Kanji | null>(null);

  const handleSelect = (meaning: string) => {
    if (selected === null) {
      setSelected(meaning);
    } else {
      const isMatch = selected === currentKanji?.meaning;
      if (isMatch) {
        setCorrect(correct + 1);
      }
      setSelected(null);
    }
  };

  const generateMeanings = (): string[] => {
    const shuffledMeanings = options
      .filter((kanji) => kanji.character !== currentKanji?.character)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((kanji) => kanji.meaning);

    const correctMeaning = currentKanji?.meaning;
    if (correctMeaning) {
      const randomIndex = Math.floor(Math.random() * 4);
      shuffledMeanings.splice(randomIndex, 0, correctMeaning);
    }

    return shuffledMeanings;
  };

  useEffect(() => {
    setCurrentKanji(options[Math.floor(Math.random() * options.length)]);
  }, [options]);

  return (
    <div>
      <h2>Kanji Matching Game</h2>
      {currentKanji ? (
        <>
          <p>Match the Kanji "{currentKanji.character}" with its meaning:</p>
          <div>
            {generateMeanings().map((meaning) => (
              <button
                key={meaning}
                className={selected === meaning ? "selected" : ""}
                onClick={() => handleSelect(meaning)}
              >
                {meaning}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
      <p>Correct: {correct}</p>
    </div>
  );
};

export default KanjiQuiz;
