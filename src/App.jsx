import { useEffect, useCallback } from 'react';
import './App.css';
import Node from './Node';
import { useState, useMemo, useRef } from 'react';
let id = 0;
const getId = () => {
  return id++;
};
const scopeEval = function (source, scope = {}) {
  // yes I NEED EVAL

  // eslint-disable-next-line no-new-func
  const result = Function(
    ...Object.keys(scope),
    `return eval(${JSON.stringify(source)})`
  ).apply(
    scope.this,
    Object.keys(scope).map(k => scope[k])
  );
  return [scope, result];
};

function App() {
  const [nodes, setNodes] = useState(() => [
    { title: '基础伤害', value: '20', id: getId() },
  ]);
  const historyNodes = useRef([]);
  const saveHistoryNodes = useCallback(() => {
    historyNodes.current = [...historyNodes.current, JSON.stringify(nodes)];
  }, [nodes]);
  const undo = useCallback(() => {
    if (historyNodes.current.length > 0) {
      setNodes(historyNodes.current.pop());
    }
  }, [historyNodes]);
  const dblClkPosRef = useRef(undefined);
  const result = useMemo(() => {
    let _nodes = JSON.parse(JSON.stringify(nodes));
    let nodeConsts = {};
    let dirty = true;
    let itCount = 0;
    try {
      while (itCount < 10000 && dirty) {
        itCount++;
        dirty = false;
        _nodes.forEach(node => {
          try {
            const [, res] = scopeEval(node.value, nodeConsts);
            if (res !== undefined && res !== node.value) {
              dirty = true;
              node.value = res;
              nodeConsts[node.title] = res;
            }
          } catch {
            // empty
          }
        });
      }
      console.log(itCount);
      return nodeConsts;
    } catch (e) {
      return nodeConsts;
    }
  }, [nodes]);

  useEffect(() => {
    let debounceTimer;
    debounceTimer = setTimeout(() => {
      saveHistoryNodes();
    }, 1000);
    return () => clearTimeout(debounceTimer);
  }, [nodes, saveHistoryNodes]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo]);

  return (
    <div
      className="App"
      onDoubleClick={e => {
        dblClkPosRef.current = { x: e.pageX - 50, y: e.pageY - 30 };
        setNodes(n => {
          const id = getId();
          return [...n, { title: '新节点' + id, value: '1', id: id }];
        });
      }}
    >
      {nodes.map((node, index) => (
        <Node
          key={node.id}
          initialTitle={node.title}
          initialValue={node.value}
          initialPosition={dblClkPosRef.current}
          result={result}
          onValueChange={value =>
            setNodes(nodes => {
              // 检查 value 是否与原 nodes[index] 完全一致，如果一致则不更新
              if (
                nodes[index] &&
                nodes[index].title === value.title &&
                nodes[index].value === value.value
              ) {
                return nodes;
              }
              nodes[index] = { ...nodes[index], ...value };
              return [...nodes];
            })
          }
          onRemove={() => {
            setNodes(nodes => {
              return nodes.slice(0, index).concat(nodes.slice(index + 1));
            });
          }}
        />
      ))}
      <div className="current-value">
        <p>{/* 当前值: <span>{result}</span> */}</p>
      </div>
    </div>
  );
}

export default App;
