原函数：  
```javascript
function calculateExpectedDamageMultiplier(initialReflexChance) {
    // 将概率转换为小数形式
    const minReflexChance = 0.66;
    const reflexDecay = 0.8;
    const damageIncreasePerReflex = 0.12;
    let currentReflexChance = initialReflexChance;
    
    let expectedDamage = 0;
    let currentDamageMultiplier = 1.0; // 第一次命中100%伤害
    let totalDamageMultiplier=0;
    let reflexCount = 0;
    let currentProbability = 1.0; // 当前轮次发生的概率
    
    // 计算每一轮次的期望伤害
    while (currentProbability > 0.000001) { // 当概率足够小时停止计算
        // 当前轮次的期望伤害贡献
        totalDamageMultiplier+=currentDamageMultiplier;
        
        // 计算触发反曲的概率
        const reflexProbability = Math.min(1,currentReflexChance);
        const stopProbability = 1 - reflexProbability;
        
        // 技能在当前轮次结束的概率
        expectedDamage += totalDamageMultiplier*stopProbability*currentProbability; // 技能结束，无额外伤害
        // 更新下一轮次的概率和参数
        currentProbability *= reflexProbability;
        
        reflexCount++;
        
        // 更新下次反曲概率（不低于最小值）
        currentReflexChance = Math.max(currentReflexChance * reflexDecay, minReflexChance);
        
        // 更新下次伤害倍率（不超过最大值）
        if (reflexCount <= 12) { // 第13次后固定，所以第12次反曲后就不再增加
            currentDamageMultiplier = 1.0 + (reflexCount * damageIncreasePerReflex);
        }
    }
    
    return expectedDamage;
}
```

最小化：  
```javascript
function (e){let a=e,t=0,l=1,c=0,n=0,o=1;for(;1e-6<o;){c+=l;var r=Math.min(1,a),i=1-r;t+=c*i*o,console.log(n,a,o,r,l,i*o,c),o*=r,n++,a=Math.max(.8*a,.66),n<=12&&(l=1+.12*n)}return t}
```