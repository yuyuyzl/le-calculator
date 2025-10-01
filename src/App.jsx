import './App.css';
import Node from './Node';
import { useState, useMemo, useRef } from 'react';
const deepCopy = obj => {
  return JSON.parse(JSON.stringify(obj));
};
function App() {
  const [nodes, setNodes] = useState([{ title: '基础伤害', value: '20' }]);
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
  return (
    <div
      className="App"
      onDoubleClick={e => {
        console.log('dbl', e);
        dblClkPosRef.current = { x: e.pageX - 50, y: e.pageY - 30 };
        setNodes(n => [...n, { title: '新节点', value: '1' }]);
      }}
    >
      {nodes.map((node, index) => (
        <Node
          key={index}
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
