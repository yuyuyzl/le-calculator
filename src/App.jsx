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
const extractUndefinedVariable = errorMessage => {
  const patterns = [
    /ReferenceError: ([^ ]+) is not defined/,
    /([^ ]+) is not defined/,
    /ReferenceError: Can't find variable: ([^ ]+)/,
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};
const hasSelection = () => {
  // 检查是否聚焦在input或textarea内
  const activeElement = document.activeElement;
  const isInputFocused =
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true');

  if (isInputFocused) {
    return true; // 如果聚焦在输入框内，不执行后续操作
  }

  // 获取当前选中内容
  const selection = window.getSelection();
  const hasTextSelected =
    selection.rangeCount > 0 && selection.toString().trim() !== '';

  return hasTextSelected;
};

function App() {
  const [nodes, setNodes] = useState(() => {
    if (localStorage.getItem('nodes')) {
      try {
        const ret = JSON.parse(localStorage.getItem('nodes'));
        ret.forEach(node => {
          delete node.x;
          delete node.y;
        });
        return ret;
      } catch {
        // empty
      }
    }
    return [{ title: '基础伤害', value: '20', id: getId() }];
  });
  const [nodePositions, _setNodePositions] = useState(() => {
    let pos = {};
    if (localStorage.getItem('nodes')) {
      try {
        const ret = JSON.parse(localStorage.getItem('nodes'));
        ret.forEach(node => {
          pos[node.id] = { x: node.x, y: node.y };
        });
      } catch {
        // empty
      }
    }
    return pos;
  });
  const [repositionState, setRepositionState] = useState(0);
  const repositionRef = useRef(false);
  const setNodePositions = useCallback(pos => {
    _setNodePositions(pos);
    repositionRef.current = true;
  }, []);
  const [compareSnapshot, setCompareSnapshot] = useState();
  const [autoLayout, setAutoLayout] = useState(false);
  const historyNodes = useRef([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const undo = useCallback(() => {
    if (historyNodes.current.length > 1) {
      historyNodes.current.pop();
      setNodes(
        JSON.parse(historyNodes.current[historyNodes.current.length - 1])
      );
    }
  }, [historyNodes]);
  const [result, error, rounds, maxRound] = useMemo(() => {
    let _nodes = JSON.parse(JSON.stringify(nodes));
    let nodeConsts = {};
    let nodeErrors = {};
    let nodeRounds = {};
    let dirty = true;
    let itCount = 0;
    try {
      while (itCount < 10000 && dirty) {
        let itIndex = 0;
        let newConsts = {};
        dirty = false;
        _nodes.forEach(node => {
          try {
            let [, res] = scopeEval(node.value, nodeConsts);
            if (res !== undefined && res !== node.value) {
              if (node.percentage) {
                res = res / 100;
              }
              if (node.addOne) {
                res = res + 1;
              }
              dirty = true;
              node.value = res;
              newConsts[node.title] = res;
              nodeErrors[node.title] = undefined;
              nodeRounds[node.title] = [itCount, itIndex];
              itIndex++;
            }
          } catch (e) {
            nodeErrors[node.title] = e;
            // empty
          }
        });
        nodeConsts = { ...nodeConsts, ...newConsts };
        itCount++;
      }
      return [nodeConsts, nodeErrors, nodeRounds, itCount];
    } catch (e) {
      return [nodeConsts, nodeErrors, nodeRounds, itCount];
    }
  }, [nodes]);

  const exportNodes = useCallback(() => {
    return nodes
      .map(node => ({
        text: `${node.title}=${node.value}${node.percentage ? ' //%' : ''}${node.addOne ? ' //+' : ''}`,
        order: rounds?.[node.title]?.[0],
      }))
      .sort((a, b) => -a.order + b.order)
      .map(item => item.text)
      .join('\n');
  }, [nodes, rounds]);

  useEffect(() => {
    if (!nodes) return;
    if (autoLayout) return;
    repositionRef.current = false;
    const _nodes = JSON.parse(JSON.stringify(nodes));
    _nodes.forEach(node => {
      node.x = nodePositions[node.id]?.x;
      node.y = nodePositions[node.id]?.y;
    });
    localStorage.setItem('nodes', JSON.stringify(_nodes));
    if (
      historyNodes.current[historyNodes.current.length - 1] ===
      JSON.stringify(nodes)
    ) {
      return;
    }
    historyNodes.current = [...historyNodes.current, JSON.stringify(nodes)];
  }, [nodes, repositionState, autoLayout]);

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

  useEffect(() => {
    const handleCopy = () => {
      if (hasSelection()) {
        return;
      }
      navigator.clipboard.writeText(exportNodes());
    };
    window.addEventListener('copy', handleCopy);
    return () => {
      window.removeEventListener('copy', handleCopy);
    };
  }, [exportNodes]);

  useEffect(() => {
    const handlePaste = e => {
      // 获取当前光标
      if (hasSelection()) {
        return;
      }

      // 阻止默认的粘贴行为
      e.preventDefault();

      // 获取剪贴板数据
      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedData = clipboardData.getData('text');

      console.log('粘贴的内容:', pastedData);

      // 在这里处理粘贴的数据
      // 例如：解析JSON数据并更新nodes
      try {
        const loadedNodes = JSON.parse(pastedData);
        if (Array.isArray(loadedNodes)) {
          let pos = {};
          try {
            loadedNodes.forEach(node => {
              if (node.x !== undefined) pos[node.id] = { x: node.x, y: node.y };
            });
          } catch {
            // empty
          }
          loadedNodes.forEach(node => {
            delete node.x;
            delete node.y;
          });
          setNodes(loadedNodes);
          setNodePositions(pos);
          if (Object.keys(pos).length === 0) {
            setAutoLayout(true);
          }
        }
        return;
      } catch {
        // empty
      }
      // 只按第一个 = 或 : 拆分
      const lines = pastedData.split('\n');
      lines.forEach((line, index) => {
        const match = line.match(/([^=:]+)[=:](.*)/);
        const title = match ? match[1].trim() : undefined;
        let value = match ? match[2].trim() : undefined;
        if (title && value) {
          const percentage =
            value?.endsWith('%') ||
            value?.includes('/*%*/') ||
            value?.includes('//%');
          if (percentage) {
            value = value.replace('/*%*/', '').replace('//%', '');
            value = value.replace(/%$/, '');
          }
          const addOne = value?.includes('/*+*/') || value?.includes('//+');
          if (addOne) {
            value = value.replace('/*+*/', '').replace('//+', '');
          }
          value = value.trim();
          const id = getId();
          setNodes(nodes => {
            // 如果 nodes 中已经存在 title
            if (nodes.find(node => node.title === title)) {
              // 则更新 value
              nodes.find(node => node.title === title).value = value;
              return [...nodes];
            }
            let passed = false;
            try {
              eval(title);
            } catch (e) {
              // setTitle(newTitle);
              passed = true;
            }
            if (passed) {
              setNodePositions(o => ({
                ...o,
                [id]: {
                  x: mousePos.current.x - 50 + index * 50,
                  y: mousePos.current.y - 30 + index * 50,
                },
              }));
              return [...nodes, { title, value, id, percentage, addOne }];
            }
            return nodes;
          });
        }
      });
    };

    // 在document上监听paste事件
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const onSave = () => {
    const _nodes = JSON.parse(JSON.stringify(nodes));
    _nodes.forEach(node => {
      node.x = nodePositions[node.id]?.x;
      node.y = nodePositions[node.id]?.y;
    });
    const dataStr = JSON.stringify(_nodes, null, 2);
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
            let pos = {};
            try {
              loadedNodes.forEach(node => {
                if (node.x !== undefined)
                  pos[node.id] = { x: node.x, y: node.y };
              });
            } catch {
              // empty
            }
            loadedNodes.forEach(node => {
              delete node.x;
              delete node.y;
            });
            setNodes(loadedNodes);
            setNodePositions(pos);
            if (Object.keys(pos).length === 0) {
              setAutoLayout(true);
            }
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
      onMouseMove={e => {
        mousePos.current = { x: e.pageX, y: e.pageY };
      }}
      onMouseUp={() => {
        if (repositionRef.current) setRepositionState(o => o + 1);
        repositionRef.current = false;
      }}
      onDoubleClick={e => {
        const id = getId();
        setNodePositions(o => ({
          ...o,
          [id]: {
            x: e.pageX - 50,
            y: e.pageY - 30,
          },
        }));
        setNodes(n => {
          return [...n, { title: '新节点' + id, value: '1', id: id }];
        });
      }}
    >
      {nodes.map((node, index) => (
        <Node
          key={node.id}
          node={node}
          x={nodePositions[node.id]?.x ?? 100 + 100 * Math.floor(index / 5)}
          y={nodePositions[node.id]?.y ?? 100 + 100 * (index % 5)}
          setX={x =>
            setNodePositions(o => ({ ...o, [node.id]: { ...o[node.id], x } }))
          }
          setY={y =>
            setNodePositions(o => ({ ...o, [node.id]: { ...o[node.id], y } }))
          }
          result={result?.[node.title]}
          error={error?.[node.title]}
          rounds={rounds?.[node.title]}
          compareSnapshot={compareSnapshot?.[node.title]}
          onAutoSolve={({ x, y }) => {
            const tempResult = JSON.parse(JSON.stringify(result));
            const toAdd = [];
            let fixed = false;
            let attempts = 0;
            const maxAttempts = 100;

            while (!fixed && attempts < maxAttempts) {
              attempts++;
              try {
                scopeEval(node.value, tempResult);
                fixed = true;
              } catch (e) {
                if (e instanceof ReferenceError) {
                  const undefinedVar = extractUndefinedVariable(e.message);
                  if (undefinedVar) {
                    // 给未定义变量一个默认值
                    tempResult[undefinedVar] = 1;
                    toAdd.push(undefinedVar);
                  } else {
                    console.error('无法解析的引用错误:', e.message);
                    break;
                  }
                } else {
                  console.error('其他错误:', e.message);
                  break;
                }
              }
            }

            if (fixed) {
              setNodes(nodes => {
                const ret = [...nodes];
                let addCount = 0;
                toAdd.forEach(item => {
                  if (!ret.find(node => node.title === item)) {
                    const id = getId();
                    ret.push({ title: item, value: '1', id: id });
                    setNodePositions(o => ({
                      ...o,
                      [id]: {
                        x: x + addCount * 50,
                        y: y + 200 + addCount++ * 50,
                      },
                    }));
                  }
                });
                return ret;
              });
            }
          }}
          onValueChange={value =>
            setNodes(nodes => {
              // 检查 value 中的每个元素是否与 nodes[index] 中的对应元素一致，如果一致则不更新
              const isAllEqual = Object.keys(value).every(key => {
                return nodes[index][key] === value[key];
              });
              if (isAllEqual) {
                return nodes;
              }
              const ret = [...nodes];
              ret[index] = { ...nodes[index], ...value };
              Object.keys(value).forEach(key => {
                if (value[key] === undefined) {
                  delete ret[index][key];
                }
              });
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
      {autoLayout && (
        <div className="nodes-grid">
          {Array.from({ length: maxRound }).map((_, index) => (
            <div className="nodes-row" key={index}>
              {nodes
                .filter(node => rounds?.[node.title]?.[0] === index)
                .map(node => (
                  <Node
                    isAutoLayout={true}
                    key={node.id}
                    node={node}
                    result={result?.[node.title]}
                    error={error?.[node.title]}
                    rounds={rounds?.[node.title]}
                    compareSnapshot={compareSnapshot?.[node.title]}
                    onAutoPosition={({ x, y }) => {
                      setNodePositions(o => ({ ...o, [node.id]: { x, y } }));
                      setAutoLayout(false);
                    }}
                  />
                ))}
              <Node
                isAutoLayout={true}
                node={{}}
                onAutoPosition={() => {
                  setAutoLayout(false);
                }}
              ></Node>
            </div>
          ))}
        </div>
      )}
      <div
        className="toolbar"
        onClick={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
      >
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
        <div className={'toolbar-item'} onClick={() => setAutoLayout(true)}>
          自动布局
        </div>
        <div
          className={'toolbar-item'}
          onClick={() => {
            window.open(
              'https://github.com/yuyuyzl/le-calculator/blob/main/README.md',
              '_blank'
            );
          }}
        >
          帮助
        </div>
      </div>
    </div>
  );
}

export default App;
