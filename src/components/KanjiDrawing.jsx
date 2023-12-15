import React, { useEffect } from 'react';

function extractPathsFromKanjiVG(kanjiVG) {
  const paths = {};

  const groups = kanjiVG.querySelectorAll('g[id^="kvg:"]');
  groups.forEach((group) => {
    const groupId = group.getAttribute('id');
    const pathsInGroup = [];

    const pathsInGroupElements = group.querySelectorAll('path');
    pathsInGroupElements.forEach((path) => {
      const pathId = path.getAttribute('id');
      const pathData = path.getAttribute('d');

      pathsInGroup.push({
        id: pathId,
        type: path.getAttribute('kvg:type'),
        data: pathData,
      });
    });

    paths[groupId] = pathsInGroup;
  });

  return paths;
}

function KanjiDrawing() {
  useEffect(() => {
    const kanjiSVGString = `
      <!-- Your KanjiVG XML here -->
    `;

    const parser = new DOMParser();
    const kanjiVGDocument = parser.parseFromString(kanjiSVGString, 'application/xml');
    const extractedPaths = extractPathsFromKanjiVG(kanjiVGDocument);

    // Use extractedPaths in your application as needed
    console.log(extractedPaths);
  }, []);

  return <div>Rendering Kanji Drawing...</div>;
}

export default KanjiDrawing;
