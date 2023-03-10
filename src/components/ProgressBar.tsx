import React from 'react'
import "../styles/ProgressBar.css"


const progressBar = ({ percent }) => {

  const style = {
    width: `${percent}%`,
  };

  return (
    <div className="progress-bar">
      <div className="progress" style={style}></div>
      <span className="percent">{percent.toFixed(2)}%</span>
    </div>
  );
};

export default progressBar