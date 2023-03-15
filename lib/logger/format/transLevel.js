/*
用來將level轉換成大寫，並且判斷是否為core，是的話就在level之前加上'CORE_'
*/
const transLevel = (type) => ({
  transform(info) {
    let level = info.level.toUpperCase();
    if (type === 'core') level = `CORE_${level}`;
    const newInfo = { ...info, level, [Symbol.for('level')]: level };
    return newInfo;
  },
});

module.exports = transLevel;
