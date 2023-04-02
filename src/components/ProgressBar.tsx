import React from 'react'
import "../styles/ProgressBar.css"


const ProgressBar = ({ percent }) => {

  const style = {
    width: `${percent}%`,
  };

  return (
    <div className="progress-bar" style={style}>
      <div className="progress" style={style}><span className="percent">{percent.toFixed(2)}%</span></div>
      
    </div>
  );
};

export default ProgressBar