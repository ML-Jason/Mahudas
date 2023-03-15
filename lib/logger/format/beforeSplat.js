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
