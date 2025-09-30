import './App.css';
import Node from './Node';
import { useState, useMemo } from 'react';
function App() {
  const [nodes, setNodes] = useState([{ title: '基础伤害', value: '20' }]);
  const result = useMemo(() => {
    let res = null;
    try {
      res = nodes.reduce((acc, node) => acc + eval(node.value), 0);
    } catch (e) {
      res = 'ERROR';
    }
    return res;
  }, [nodes]);
  return (
    <div className="App">
      {nodes.map((node, index) => (
        <Node
          key={index}
          initialTitle={node.title}
          initialValue={node.value}
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
              nodes[index] = value;
              return [...nodes];
            })
          }
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
