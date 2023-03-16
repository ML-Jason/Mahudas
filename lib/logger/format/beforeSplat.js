/*
執行 format.splat() 之前的前處理，
目的在補足splat的缺失
*/

const beforeSplat = () => ({
  transform(info) {
    const formatRegExp = /%[scdjifoO%]/g;
    let msg = info.message;

    // 比對傳入的message裡是否有 %s、%o 這些控制字元
    const regMatched = msg && msg.match && msg.match(formatRegExp);

    // 取得splat的陣列
    const splat = info[Symbol.for('splat')] || info.splat || [];

    // 修正winston傳入第二個參數如果是{message:'something'}的情況下，會自動把message接到info.message後面的問題
    // 判斷splat[0]是否有message這個變數
    // 如果有的話就把splat[0].message從info.message最後面移除
    if (splat.length > 0) {
      try {
        if (splat[0].message) {
          const regexp = new RegExp(` ${splat[0].message}$`);
          msg = info.message.replace(regexp, '');
        }
      } catch (e) { /* */ }
    }

    // 比對splat的數量是否跟控制字元數量相同
    // 若是splat的數量比控制字元還多，就自動在message補上相等數量的%O
    // 這是用來讓format.splat()可以順利的自動帶入多餘的splat到message裡
    splat.forEach((v, i) => {
      if (!regMatched || !regMatched[i]) {
        msg += ' %O';
      }
    });

    const newInfo = { ...info, message: msg };
    return newInfo;
  },
});

module.exports = beforeSplat;
