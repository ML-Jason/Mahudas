/**
 * 將字串轉換成駝峰式
 */

module.exports = (str) => {
  const tmps = str.split('_');
  let newstr = '';
  tmps.forEach((v) => {
    if (newstr === '') {
      newstr = v.toLowerCase();
    } else {
      newstr += v[0].toUpperCase() + v.slice(1);
    }
  });
  return newstr;
};
