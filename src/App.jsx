import { useEffect, useCallback } from 'react';
import './App.css';
import Node from './Node';
import { useState, useMemo, useRef } from 'react';
let id = 0;
const getId = () => {
  return id++;
};
const scopeEval = function (source, scope = {}) {
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
  const [compareSnapshot, setCompareSnapshot] = useState();
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
              nodeErrors[node.title] = undefined;
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

  const onSave = () => {
    const dataStr = JSON.stringify(nodes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nodes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const onLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const loadedNodes = JSON.parse(e.target.result);
            setNodes(loadedNodes);
          } catch (error) {
            alert('文件格式错误，请选择有效的JSON文件');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const onClear = () => {
    localStorage.removeItem('nodes');
    setNodes([]);
  };

  const onCompareSnapshot = () => {
    setCompareSnapshot(o =>
      o ? undefined : JSON.parse(JSON.stringify(result))
    );
  };

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
          compareSnapshot={compareSnapshot}
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
      <div className="toolbar">
        <div className="toolbar-item" onClick={onLoad}>
          载入
        </div>
        <div className="toolbar-item" onClick={onSave}>
          保存
        </div>
        <div className="toolbar-item" onClick={onClear}>
          清空
        </div>
        <div
          className={
            'toolbar-item' + (compareSnapshot ? ' toolbar-item-active' : '')
          }
          onClick={onCompareSnapshot}
        >
          快照
        </div>
      </div>
    </div>
  );
}

export default App;
