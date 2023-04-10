import { useState } from "react";
import IconSearchLoading from "../assets/icons/SearchIcon";

import "../styles/SearchBar.css";




interface Kanji {
  character?: string;
  meanings?: string[];
  freq?: number;
  grade?: number;
  jlpt_new?: number;
  jlpt_old?: number;
  category?: string;
  strokes?: number;
  readings_kun?: string;
  readings_on?: string;
  wk_radicals?: string;
}

export const SearchBar = ({ setResults }: any) => {

  const [input, setInput] = useState("");

  const fetchData = (value: Kanji[]) => {
    fetch("/kanjiData/joyo.json")
      .then((response) => response.json())
      .then((json) => {
        const results = json.filter((kanji: Kanji[]) => {
          return (
            
            kanji
            
          );
        });
        setResults(results);
      });
  };

  const handleChange = (value: any) => {
    setInput(value);
    fetchData(value);
  };

  return (
    <div className="input-wrapper">
      <IconSearchLoading />
      <input
        placeholder="Search kanji"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
};