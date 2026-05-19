import React, { useState, useMemo } from 'react';
import './MatchQuestion.css';

export default function MatchQuestion({ pairs, value = {}, onChange }) {
  const [selected, setSelected] = useState(null); // { side: 'left'|'right', id, text }

  const rightItems = useMemo(() => {
    return [...pairs].sort(() => Math.random() - 0.5);
  }, []); // eslint-disable-line

  // value: { leftId: rightItem }
  const handleLeftClick = (pair) => {
    if (selected?.side === 'right') {
      // Pair them
      const newVal = { ...value, [pair.id]: selected.text };
      onChange(newVal);
      setSelected(null);
    } else {
      setSelected({ side: 'left', id: pair.id, text: pair.left_item });
    }
  };

  const handleRightClick = (item) => {
    if (selected?.side === 'left') {
      const newVal = { ...value, [selected.id]: item.right_item };
      onChange(newVal);
      setSelected(null);
    } else {
      setSelected({ side: 'right', id: item.id, text: item.right_item });
    }
  };

  const clearPair = (leftId) => {
    const newVal = { ...value };
    delete newVal[leftId];
    onChange(newVal);
  };

  const usedRightItems = Object.values(value);

  return (
    <div className="match-question">
      <p className="match-hint">Kattints egy bal oldali elemre, majd a hozzá tartozó jobb oldalira!</p>

      {/* Paired items */}
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

      {/* Right items pool */}
      <div className="match-pool">
        <p className="match-pool-label">Elérhető párok:</p>
        <div className="match-pool-items">
          {rightItems.map(item => {
            const used = usedRightItems.includes(item.right_item);
            return (
              <button
                key={item.id}
                className={`match-pool-item ${used ? 'used' : ''} ${selected?.side === 'right' && selected.id === item.id ? 'selected-item' : ''}`}
                onClick={() => !used && handleRightClick(item)}
                disabled={used}
              >
                {item.right_item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
