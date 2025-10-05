import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import './Node.css';
import { NumberUtils } from './utils/numberUtils';

const Node = ({
  isAutoLayout,
  node,
  onValueChange,
  onRemove,
  result,
  error,
  compareSnapshot,
  onAutoSolve,
  x,
  setX,
  y,
  setY,
  onAutoPosition,
}) => {
  // const [x, setX] = useState(initialPosition.x);
  // const [y, setY] = useState(initialPosition.y);
  const dragStartPositionRef = useRef(null);
  const { title, value } = node;

  const handleInputChange = e => {
    const newValue = e.target.value;
    // setValue(newValue);
    onValueChange?.({ value: newValue });
  };

  const handleTitleChange = () => {
    // prompt
    const newTitle = prompt('请输入节点标题');
    if (newTitle) {
      try {
        eval(newTitle);
      } catch (e) {
        // setTitle(newTitle);
        onValueChange?.({ title: newTitle });
        return;
      }

      alert('节点标题不合法');
    }
  };

  const handlePercentageChange = () => {
    onValueChange?.({
      percentage: node.percentage === true ? undefined : true,
    });
  };

  const handleAddOne = () => {
    onValueChange?.({ addOne: node.addOne === true ? undefined : true });
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

  useLayoutEffect(() => {
    if (isAutoLayout) {
      const nodeElement = document.getElementById(
        'auto-layout-node-' + node.id
      );
      if (nodeElement) {
        onAutoPosition?.(nodeElement.getBoundingClientRect());
      }
    }
  }, [isAutoLayout, node.id]);
  return (
    <div
      className={`node ${isAutoLayout ? 'auto-layout' : ''}`}
      id={isAutoLayout ? 'auto-layout-node-' + node.id : ''}
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
      <div className={`node-header ${error ? 'error' : ''}`}>
        <h3 className="node-title" onDoubleClick={handleTitleChange}>
          {title}
        </h3>
        <div className="node-header-right">
          <div
            className={`node-header-right-item ${node.percentage ? 'active' : ''}`}
            onClick={handlePercentageChange}
          >
            %
          </div>
          <div
            className={`node-header-right-item ${node.addOne ? 'active' : ''}`}
            onClick={handleAddOne}
          >
            +1
          </div>
          <div className="node-remove" onClick={onRemove}>
            +
          </div>
        </div>
      </div>
      <div className="node-content">
        <textarea
          type="text"
          className="node-input"
          rows={1}
          value={value}
          onChange={handleInputChange}
          placeholder="输入值..."
          onMouseDown={e => e.stopPropagation()}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.target.blur();
              onAutoSolve?.({ x, y });
            }
          }}
        />
      </div>
      {(isNaN(+value) || node.percentage || node.addOne) &&
        result !== +value &&
        result !== undefined && (
          <div className="node-result">
            <span>=</span>
            <span className="node-result-num">
              {NumberUtils.formatNumber(result * (node.percentage ? 100 : 1))}
              {node.percentage ? '%' : ''}
            </span>
            {compareSnapshot && compareSnapshot !== result && (
              <span className="node-result-compare">
                {result > compareSnapshot ? '↑' : '↓'}{' '}
                {NumberUtils.formatNumber(result - compareSnapshot)}
                {'/'}
                {NumberUtils.formatNumber(
                  (Math.abs(result - compareSnapshot) / compareSnapshot) * 100
                )}
                %
              </span>
            )}
          </div>
        )}
      {error && (
        <div className="node-result">
          <span className="node-result-error">{error.message}</span>
        </div>
      )}
    </div>
  );
};

export default Node;
