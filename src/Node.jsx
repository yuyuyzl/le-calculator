import React, { useState } from 'react';
import './Node.css';

const Node = ({ initialTitle = '节点', initialValue = '', onValueChange }) => {
  const [title, setTitle] = useState(initialTitle);
  const [value, setValue] = useState(initialValue);

  const handleInputChange = e => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const handleTitleChange = () => {
    // prompt
    const newTitle = prompt('请输入节点标题');
    if (newTitle) {
      setTitle(newTitle);
    }
  };

  return (
    <div className="node">
      <div className="node-header">
        <h3 className="node-title" onDoubleClick={handleTitleChange}>
          {title}
        </h3>
      </div>
      <div className="node-content">
        <input
          type="text"
          className="node-input"
          value={value}
          onChange={handleInputChange}
          placeholder="输入值..."
        />
      </div>
    </div>
  );
};

export default Node;
