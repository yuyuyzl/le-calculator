import { useEffect, useCallback } from 'react';
import './App.css';
import Node from './Node';
import { useState, useMemo, useRef } from 'react';
const deepCopy = obj => {
  return JSON.parse(JSON.stringify(obj));
};
let id = 0;
const getId = () => {
  return id++;
};
function App() {
  const [nodes, setNodes] = useState(() => [
    { title: '基础伤害', value: '20', id: getId() },
  ]);
  const historyNodes = useRef([]);
  const saveHistoryNodes = useCallback(() => {
    historyNodes.current = [...historyNodes.current, deepCopy(nodes)];
  }, [nodes]);
  const undo = useCallback(() => {
    if (historyNodes.current.length > 0) {
      setNodes(historyNodes.current.pop());
    }
  }, [historyNodes]);
  const dblClkPosRef = useRef(undefined);
  const result = useMemo(() => {
    let res = null;
    try {
      let _nodes = deepCopy(nodes);
      let dirty = true;
      let itCount = 0;
      while (itCount < 10000 && dirty) {
        itCount++;
        dirty = false;
        _nodes.forEach(node => {
          try {
            node.value = eval(node.value);
          } catch {
            _nodes.forEach(o => {
              if (isNaN(+o.value)) return;
              if (node.value.includes(o.title)) {
                node.value = node.value.replace(
                  new RegExp(o.title, 'g'),
                  o.value
                );
                o.used = true;
                dirty = true;
              }
            });
          }
        });
      }
      res = _nodes.reduce(
        (acc, node) => acc + (node.used ? 0 : +node.value),
        0
      );
      if (isNaN(res)) res = 'ERROR';
    } catch (e) {
      res = 'ERROR';
    }
    return res;
  }, [nodes]);

  console.log(nodes);

  useEffect(() => {
    let debounceTimer;
    debounceTimer = setTimeout(() => {
      saveHistoryNodes();
    }, 1000);
    return () => clearTimeout(debounceTimer);
  }, [nodes, saveHistoryNodes]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'z' && e.ctrlKey) {
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
        console.log('dbl', e);
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
        <p>
          当前值: <span>{result}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
