import React, { useRef, useLayoutEffect } from 'react';
import './Node.css';
import { NumberUtils } from './utils/numberUtils';
import { isForkOnRoute } from './utils/forkComboKey';

const Node = ({
  isAutoLayout,
  node,
  onValueChange,
  onRemove,
  result,
  error,
  compareSnapshot,
  forkResultRows,
  highlightForkComboKey,
  onForkResultRouteHover,
  onAutoSolve,
  onFork,
  onForkChange,
  onForkRemove,
  x = 100,
  setX,
  y = 100,
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
    const newTitle = prompt('请输入节点标题', title);
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

  const handleFork = () => {
    onFork?.();
  };

  const handleForkInputChange = (forkId, e) => {
    onForkChange?.(forkId, e.target.value);
  };

  const handleForkRemove = forkId => {
    onForkRemove?.(forkId);
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
  const handleForkResultRowLeave = e => {
    const t = e.relatedTarget;
    if (t && t.nodeType === 1 && highlightForkComboKey) {
      const ta = t.closest?.('textarea.node-fork-input');
      if (ta) {
        const nodeEl = ta.closest?.('[data-node-id]');
        const nid = nodeEl?.dataset?.nodeId;
        const fid = ta.dataset?.forkId;
        if (
          nid !== undefined &&
          fid !== undefined &&
          isForkOnRoute(nid, fid, highlightForkComboKey)
        ) {
          return;
        }
      }
    }
    onForkResultRouteHover?.(null);
  };

  const handleForkInputLeave = e => {
    const t = e.relatedTarget;
    if (t && t.nodeType === 1 && highlightForkComboKey) {
      const fr = t.closest?.('.node-result-fork[data-fork-id]');
      if (fr && fr.dataset.forkId === highlightForkComboKey) {
        return;
      }
      const ta2 = t.closest?.('textarea.node-fork-input');
      if (ta2) {
        const nodeEl = ta2.closest?.('[data-node-id]');
        const nid = nodeEl?.dataset?.nodeId;
        const fid = ta2.dataset?.forkId;
        if (
          nid !== undefined &&
          fid !== undefined &&
          isForkOnRoute(nid, fid, highlightForkComboKey)
        ) {
          return;
        }
      }
    }
    onForkResultRouteHover?.(null);
  };

  return (
    <div
      className={`node ${isAutoLayout ? 'auto-layout' : ''}`}
      id={isAutoLayout ? 'auto-layout-node-' + node.id : ''}
      data-node-id={node.id ?? ''}
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
        <h3
          className="node-title"
          onDoubleClick={handleTitleChange}
          onContextMenu={e => {
            // 复制标题
            navigator.clipboard.writeText(title);
            e.preventDefault();
          }}
        >
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
          {onFork && (
            <div
              className="node-header-right-item node-header-fork"
              title="fork"
              onClick={handleFork}
            >
              ⋎
            </div>
          )}
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
            if (e.key === 'Enter' && !e.shiftKey && error) {
              e.preventDefault();
              e.target.blur();
              onAutoSolve?.({ x, y });
            }
          }}
        />
        {(node.forks || []).map(fork => (
          <div
            key={fork.id}
            className={`node-fork-row${
              isForkOnRoute(node.id, fork.id, highlightForkComboKey)
                ? ' node-fork-row-route'
                : ''
            }`}
          >
            <textarea
              type="text"
              className={`node-input node-fork-input${
                isForkOnRoute(node.id, fork.id, highlightForkComboKey)
                  ? ' node-fork-input-route'
                  : ''
              }`}
              data-fork-id={fork.id}
              rows={1}
              value={fork.value}
              onChange={e => handleForkInputChange(fork.id, e)}
              onMouseDown={e => e.stopPropagation()}
              onMouseLeave={handleForkInputLeave}
            />
            {onForkRemove && (
              <div
                className="node-fork-remove"
                title="删除 fork"
                onClick={() => handleForkRemove(fork.id)}
                onMouseDown={e => e.stopPropagation()}
              >
                ×
              </div>
            )}
          </div>
        ))}
      </div>
      {result !== undefined &&
        !error &&
        (((isNaN(+value) || node.percentage || node.addOne) &&
          result !== +value) ||
          (node.forks || []).length > 0) && (
          <div className="node-result">
            <span>=</span>
            <span className="node-result-num">
              {NumberUtils.formatNumber(result * (node.percentage ? 100 : 1))}
              {node.percentage ? '%' : ''}
            </span>
            {compareSnapshot && compareSnapshot !== result && (
              <span
                className={
                  'node-result-compare' +
                  (result > compareSnapshot ? ' up' : ' down')
                }
              >
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
      {(() => {
        const seenOutcome = new Set();
        return (forkResultRows || [])
          .filter(fr => {
            if (!fr.error && fr.result === result) {
              return false;
            }
            const outcomeKey = fr.error
              ? `e:${fr.error.message}`
              : fr.result !== undefined
                ? `n:${fr.result}`
                : 'empty';
            if (seenOutcome.has(outcomeKey)) {
              return false;
            }
            seenOutcome.add(outcomeKey);
            return true;
          })
          .map(fr => (
            <div
              key={fr.forkId}
              className="node-result node-result-fork"
              data-fork-id={fr.forkId}
              onMouseEnter={() => onForkResultRouteHover?.(fr.forkId)}
              onMouseLeave={handleForkResultRowLeave}
            >
              <span className="node-result-fork-mark" title="fork 变体">
                ⋎
              </span>
              <span>=</span>
              {fr.error ? (
                <span className="node-result-error">{fr.error.message}</span>
              ) : fr.result !== undefined ? (
                <>
                  <span className="node-result-num">
                    {NumberUtils.formatNumber(
                      fr.result * (node.percentage ? 100 : 1)
                    )}
                    {node.percentage ? '%' : ''}
                  </span>
                  {result !== undefined && fr.result !== result && (
                    <span
                      className={
                        'node-result-compare' +
                        (fr.result > result ? ' up' : ' down')
                      }
                    >
                      {fr.result > result ? '↑' : '↓'}{' '}
                      {NumberUtils.formatNumber(fr.result - result)}
                      {'/'}
                      {NumberUtils.formatNumber(
                        (Math.abs(fr.result - result) / result) * 100
                      )}
                      %
                    </span>
                  )}
                </>
              ) : (
                <span className="node-result-num node-result-fork-empty">
                  —
                </span>
              )}
            </div>
          ));
      })()}
      {error && (
        <div className="node-result">
          <span className="node-result-error">{error.message}</span>
        </div>
      )}
    </div>
  );
};

export default Node;
