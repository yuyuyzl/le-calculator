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
  const [nodes, setNodes] = useState(() => {
    if (localStorage.getItem('nodes')) {
      try {
        const ret = JSON.parse(localStorage.getItem('nodes'));
        ret.forEach(node => {
          node.id = getId();
        });
        return ret;
      } catch {
        // empty
      }
    }
    return [{ title: '基础伤害', value: '20', id: getId() }];
  });
  const historyNodes = useRef([]);
  const undo = useCallback(() => {
    if (historyNodes.current.length > 1) {
      historyNodes.current.pop();
      setNodes(
        JSON.parse(historyNodes.current[historyNodes.current.length - 1])
      );
    }
  }, [historyNodes]);
  const dblClkPosRef = useRef(undefined);
  const [result, error] = useMemo(() => {
    let _nodes = JSON.parse(JSON.stringify(nodes));
    let nodeConsts = {};
    let nodeErrors = {};
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
          } catch (e) {
            nodeErrors[node.title] = e;
            // empty
          }
        });
      }
      return [nodeConsts, nodeErrors];
    } catch (e) {
      return [nodeConsts, nodeErrors];
    }
  }, [nodes]);

  useEffect(() => {
    if (
      historyNodes.current[historyNodes.current.length - 1] ===
      JSON.stringify(nodes)
    ) {
      return;
    }
    historyNodes.current = [...historyNodes.current, JSON.stringify(nodes)];
    localStorage.setItem('nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        undo();
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo]);

  console.log(nodes);

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
          title={node.title}
          value={node.value}
          initialPosition={
            dblClkPosRef.current || {
              x: 100 + 240 * Math.floor(index / 5),
              y: 120 * (index % 5) + 100,
            }
          }
          result={result}
          error={error}
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
              const ret = [...nodes];
              ret[index] = { ...nodes[index], ...value };
              return ret;
            })
          }
          onRemove={() => {
            setNodes(nodes => {
              return nodes.slice(0, index).concat(nodes.slice(index + 1));
            });
          }}
        />
      ))}
    </div>
  );
}

export default App;
