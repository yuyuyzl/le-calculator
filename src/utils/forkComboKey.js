/**
 * 解析 App 生成的 fork 组合键，如 "1:main+2:5"
 * @returns {{ nodeId: number, isMain: boolean, forkId?: number }[]}
 */
export function parseForkComboKey(comboKey) {
  if (!comboKey || typeof comboKey !== 'string') {
    return [];
  }
  return comboKey.split('+').map(seg => {
    const i = seg.indexOf(':');
    const nodeId = Number(seg.slice(0, i));
    const rest = seg.slice(i + 1);
    if (rest === 'main') {
      return { nodeId, isMain: true };
    }
    return { nodeId, isMain: false, forkId: Number(rest) };
  });
}

/** 当前组合是否在该节点上选中了指定 fork 输入 */
export function isForkOnRoute(nodeId, forkId, comboKey) {
  if (comboKey == null || comboKey === '') {
    return false;
  }
  if (
    nodeId === undefined ||
    nodeId === null ||
    nodeId === '' ||
    forkId === undefined ||
    forkId === null ||
    forkId === ''
  ) {
    return false;
  }
  return parseForkComboKey(comboKey).some(
    s =>
      !s.isMain &&
      Number(s.nodeId) === Number(nodeId) &&
      Number(s.forkId) === Number(forkId)
  );
}
