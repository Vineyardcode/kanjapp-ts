import React, { useState, useEffect } from 'react';


interface Kanji {
  character?: string;
  meanings?: string[];
  freq?: number;
  grade?: number;
  jlpt_new?: number;
  jlpt_old?: number;
  category?: string;
  strokes?: number;
  kanji?: string;
}

const StrokeOrder = ({kanji}: Kanji) => {

  const [kanjiDatai, setKanjiDatai] = useState<SVGSVGElement | null>(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const fetchData = async (kanji: Kanji) => {
        // Load the kanji VG indexes
        const response1 = await fetch('../kanjiData/kanjiVG_indexes.json');
        const kanjiIndexes = await response1.json();
        setResponse(kanjiIndexes)
        // Look up the kanji VG index for the given kanji
        const kanjiIndex = response[kanji].find(index => index.length === 9).slice(0, -4);

        // Load the joyo_kanji_vg.xml file
        const response2 = await fetch('src/kanjiData/joyo_kanji_vg.xml');
        const xmlString = await response2.text();
        const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
      
        // Look up the kanji element in the XML file using the kanji VG index
        const kanjiElement = xmlDoc.querySelector(`[id="kvg:${kanjiIndex}"]`);
      
        
        setKanjiDatai(kanjiElement)
      }

    fetchData(kanji);
  }, [kanji]);
console.log(response);
  return (
    <div className="kanji">
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        xmlSpace="preserve"
        version="1.1"
        baseProfile="full"
      >
        {kanjiDatai && <g dangerouslySetInnerHTML={{ __html: kanjiDatai.outerHTML }} />}
      </svg>
    </div>
  );
};

export default StrokeOrder;
