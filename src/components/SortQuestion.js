import React, { useState, useEffect } from 'react';
import './SortQuestion.css';

export default function SortQuestion({ items, value, onChange }) {
  const [order, setOrder] = useState(() => {
    if (value && value.length) return value;
    return items.map(i => i.id);
  });
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    if (!value || !value.length) {
      setOrder(items.map(i => i.id));
    }
  }, [items, value]);

  const getItemById = (id) => items.find(i => i.id === id);

  const handleDragStart = (e, id) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragOver(id);
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (dragging === targetId) return;

    const newOrder = [...order];
    const fromIdx = newOrder.indexOf(dragging);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragging);

    setOrder(newOrder);
    onChange(newOrder);
    setDragging(null);
    setDragOver(null);
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const newOrder = [...order];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    setOrder(newOrder);
    onChange(newOrder);
  };

  const moveDown = (idx) => {
    if (idx === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    setOrder(newOrder);
    onChange(newOrder);
  };

  return (
    <div className="sort-question">
      <p className="sort-hint">Húzd a helyes sorrendbe, vagy használd a nyilakat!</p>
      <div className="sort-list">
        {order.map((id, idx) => {
          const item = getItemById(id);
          if (!item) return null;
          return (
            <div
              key={id}
              className={`sort-item ${dragging === id ? 'dragging' : ''} ${dragOver === id ? 'drag-over' : ''}`}
              draggable
              onDragStart={e => handleDragStart(e, id)}
              onDragOver={e => handleDragOver(e, id)}
              onDrop={e => handleDrop(e, id)}
              onDragEnd={() => { setDragging(null); setDragOver(null); }}
            >
              <span className="sort-pos">{idx + 1}</span>
              <span className="sort-handle">⠿</span>
              <span className="sort-text">{item.item_text}</span>
              <div className="sort-arrows">
                <button onClick={() => moveUp(idx)} disabled={idx === 0}>▲</button>
                <button onClick={() => moveDown(idx)} disabled={idx === order.length - 1}>▼</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
