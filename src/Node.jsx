import React, { useState, useRef, useEffect } from 'react';
import './Node.css';

const Node = ({
  initialTitle = '节点',
  initialValue = '',
  onValueChange,
  onRemove,
  initialPosition = { x: 100, y: 100 },
  result,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [value, setValue] = useState(initialValue);
  const [x, setX] = useState(initialPosition.x);
  const [y, setY] = useState(initialPosition.y);
  const dragStartPositionRef = useRef(null);

  useEffect(() => {
    onValueChange?.({ title, value });
  }, [title, value, onValueChange]);

  const handleInputChange = e => {
    const newValue = e.target.value;
    setValue(newValue);
  };

  const handleTitleChange = () => {
    // prompt
    const newTitle = prompt('请输入节点标题');
    if (newTitle) {
      try {
        console.log(eval(newTitle));
      } catch (e) {
        console.log(e);
        setTitle(newTitle);
        return;
      }

      alert('节点标题不合法');
    }
  };

  const handleMouseDown = e => {
    dragStartPositionRef.current = {
      mouseX: e.pageX,
      mouseY: e.pageY,
      x: x,
      y: y,
    };
  };
  const handleMouseMove = e => {
    if (dragStartPositionRef.current) {
      setX(
        e.pageX -
          dragStartPositionRef.current.mouseX +
          dragStartPositionRef.current.x
      );
      setY(
        e.pageY -
          dragStartPositionRef.current.mouseY +
          dragStartPositionRef.current.y
      );
    }
  };
  const handleMouseUp = () => {
    dragStartPositionRef.current = null;
  };
  console.log(result);

  return (
    <div
      className="node"
      style={{ left: x, top: y }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={e => {
        handleMouseUp();
        e.stopPropagation();
      }}
    >
      <div className="node-header">
        <h3 className="node-title" onDoubleClick={handleTitleChange}>
          {title}
        </h3>
        <div className="node-remove" onClick={onRemove}>
          +
        </div>
      </div>
      <div className="node-content">
        <input
          type="text"
          className="node-input"
          value={value}
          onChange={handleInputChange}
          placeholder="输入值..."
          onMouseDown={e => e.stopPropagation()}
        />
      </div>
      {result?.[title] !== +value && result?.[title] !== undefined && (
        <div className="node-result">
          <span>=</span>
          <span>{result?.[title]}</span>
        </div>
      )}
    </div>
  );
};

export default Node;
