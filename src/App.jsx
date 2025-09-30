import './App.css';
import Node from './Node';

function App() {
  return (
    <div className="App">
      <Node title="输入节点" initialValue="" />
      <div className="current-value">
        <p>
          当前值: <span>{'无'}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
