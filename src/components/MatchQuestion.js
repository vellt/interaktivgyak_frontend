import React, { useState, useMemo } from 'react';
import './MatchQuestion.css';

export default function MatchQuestion({ pairs, value = {}, onChange }) {
  const [selected, setSelected] = useState(null);

  // Deduplicated right items with available count
  const rightItemPool = useMemo(() => {
    const counts = {};
    pairs.forEach(p => {
      counts[p.right_item] = (counts[p.right_item] || 0) + 1;
    });
    const unique = Object.keys(counts).map(text => ({ text, total: counts[text] }));
    return unique.sort(() => Math.random() - 0.5);
  }, []); // eslint-disable-line

  const handleLeftClick = (pair) => {
    if (selected?.side === 'right') {
      const newVal = { ...value, [pair.id]: selected.text };
      onChange(newVal);
      setSelected(null);
    } else {
      setSelected({ side: 'left', id: pair.id, text: pair.left_item });
    }
  };

  const handleRightClick = (text) => {
    if (selected?.side === 'left') {
      const newVal = { ...value, [selected.id]: text };
      onChange(newVal);
      setSelected(null);
    } else {
      setSelected({ side: 'right', text });
    }
  };

  const clearPair = (leftId) => {
    const newVal = { ...value };
    delete newVal[leftId];
    onChange(newVal);
  };

  // Count how many times each right_item text is already used
  const usedCounts = useMemo(() => {
    const counts = {};
    Object.values(value).forEach(text => {
      counts[text] = (counts[text] || 0) + 1;
    });
    return counts;
  }, [value]);

  return (
    <div className="match-question">
      <p className="match-hint">Kattints egy bal oldali elemre, majd a hozzá tartozó jobb oldalira!</p>

      <div className="match-pairs-display">
        {pairs.map(pair => (
          <div key={pair.id} className={`match-row ${value[pair.id] ? 'paired' : 'unpaired'}`}>
            <div
              className={`match-left ${selected?.side === 'left' && selected.id === pair.id ? 'selected-item' : ''}`}
              onClick={() => handleLeftClick(pair)}
            >
              {pair.left_item}
            </div>
            <div className="match-connector">
              {value[pair.id] ? '↔' : '?'}
            </div>
            <div className="match-right-slot">
              {value[pair.id] ? (
                <div className="match-right-filled">
                  {value[pair.id]}
                  <button className="match-clear" onClick={() => clearPair(pair.id)}>✕</button>
                </div>
              ) : (
                <div className="match-right-empty">— válassz —</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="match-pool">
        <p className="match-pool-label">Elérhető párok:</p>
        <div className="match-pool-items">
          {rightItemPool.map(({ text, total }) => {
            const usedCount = usedCounts[text] || 0;
            const remaining = total - usedCount;
            const isExhausted = remaining <= 0;
            const isSelected = selected?.side === 'right' && selected.text === text;

            return (
              <button
                key={text}
                className={`match-pool-item ${isExhausted ? 'used' : ''} ${isSelected ? 'selected-item' : ''}`}
                onClick={() => !isExhausted && handleRightClick(text)}
                disabled={isExhausted}
              >
                {text}{total > 1 && ` (${remaining}/${total})`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}