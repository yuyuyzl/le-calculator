// 数值处理工具类
export class NumberUtils {
  // 将浮点数四舍五入到指定位数
  static roundToFixed(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) {
      return num;
    }
    return Number.parseFloat(num.toFixed(decimals));
  }

  // 使用Math.round处理小数
  static roundToDecimals(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) {
      return num;
    }
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }

  // 智能格式化数字显示
  static formatNumber(num, maxDecimals = 6) {
    if (typeof num !== 'number' || isNaN(num)) {
      return num;
    }

    // 如果是整数，直接返回
    if (Number.isInteger(num)) {
      return num.toString();
    }

    // 对于小数，使用toFixed然后去掉尾随的0
    const fixed = num.toFixed(maxDecimals);
    return Number.parseFloat(fixed).toString();
  }

  // 安全地计算百分比
  static calculatePercentage(value, total, decimals = 2) {
    if (typeof value !== 'number' || typeof total !== 'number' || total === 0) {
      return 0;
    }
    return this.roundToDecimals((value / total) * 100, decimals);
  }

  // 安全地进行数值运算
  static safeAdd(a, b, decimals = 6) {
    const result = Number(a) + Number(b);
    return this.roundToDecimals(result, decimals);
  }

  static safeSubtract(a, b, decimals = 6) {
    const result = Number(a) - Number(b);
    return this.roundToDecimals(result, decimals);
  }

  static safeMultiply(a, b, decimals = 6) {
    const result = Number(a) * Number(b);
    return this.roundToDecimals(result, decimals);
  }

  static safeDivide(a, b, decimals = 6) {
    if (Number(b) === 0) {
      throw new Error('Division by zero');
    }
    const result = Number(a) / Number(b);
    return this.roundToDecimals(result, decimals);
  }
}
