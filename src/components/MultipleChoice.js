import React from 'react';
import './Choice.css';

export default function MultipleChoice({ options, value = [], onChange }) {
  const toggle = (id) => {
    const next = value.includes(id) ? value.filter(v => v !== id) : [...value, id];
    onChange(next);
  };

  return (
    <div className="choice-list">
      <p className="choice-hint">Jelöld meg az összes helyes választ!</p>
      {options.map(opt => (
        <label key={opt.id} className={`choice-item ${value.includes(opt.id) ? 'selected' : ''}`}>
          <input
            type="checkbox"
            checked={value.includes(opt.id)}
            onChange={() => toggle(opt.id)}
          />
          <span className="choice-checkbox" />
          <span className="choice-text">{opt.option_text}</span>
        </label>
      ))}
    </div>
  );
}
