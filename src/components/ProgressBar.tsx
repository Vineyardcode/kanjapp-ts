import React from 'react'
import "../styles/ProgressBar.css"

/* The track is always full width; only the fill is scaled. Previously the same
   `style` object was applied to BOTH elements, so a 50% value painted at 25%. */
const ProgressBar = ({ percent }: any) => {
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));

  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={Number(clamped.toFixed(2))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress" style={{ width: `${clamped}%` }}>
        <h5>{clamped.toFixed(2)}%</h5>
      </div>
    </div>
  );
};

export default ProgressBar
