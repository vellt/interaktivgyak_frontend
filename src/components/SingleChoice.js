import React from 'react';
import './Choice.css';

export default function SingleChoice({ options, value, onChange }) {
  return (
    <div className="choice-list">
      {options.map(opt => (
        <label key={opt.id} className={`choice-item ${value === opt.id ? 'selected' : ''}`}>
          <input
            type="radio"
            name={`sc-${opt.question_id}`}
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
          />
          <span className="choice-radio" />
          <span className="choice-text">{opt.option_text}</span>
        </label>
      ))}
    </div>
  );
}
