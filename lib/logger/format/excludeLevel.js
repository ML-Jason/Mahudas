/*
排除部分的level，符合的話就忽略訊息
*/

const transLevel = (levels = []) => ({
  transform(info) {
    const match = levels.some((value) => (value.toLowerCase() === info.level.toLowerCase()));
    if (match) return false;
    return info;
  },
});

module.exports = transLevel;
