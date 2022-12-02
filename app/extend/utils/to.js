const is = require('./is');
const dayjs = require('./dayjs');

const to = {};

/**
 * 轉換成字串，undefined或null都會變成空字串。
 *
 * @param {any} value - 來源字串
 * @returns {String} result string
 */
to.string = (value) => {
  if (is.nullOrUndefined(value)) return '';

  return value.toString().trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
};

/**
 * 轉換成字串，如果字串裡有【非英文字母或數字】，則回傳空字串。
 *
 * @param {String} value - 來源字串
 * @returns {String} result string
 */
to.alphanumeric = (value) => {
  const string = to.string(value);
  if (!/^[0-9A-Z]+$/i.test(value)) return '';

  return string;
};

/**
 * 轉換成字串，字串裡只能有【英文字母、數字、、以及_ @ . -】，否則回傳空字串。
 *
 * @param {String} value - 來源字串
 * @returns {String} result string
 */
to.normalString = (value) => {
  const string = to.string(value);
  if (!/^[A-Z0-9_@.-]+$/i.test(string)) return '';

  return string;
};

/**
 * 轉換成數字，如果非數字，會回傳NaN。
 *
 * @param {String|Number} value - 來源字串或數字
 * @returns {Number} result
 */
to.number = (value) => {
  const string = to.normalString(value);
  if (string === '') return NaN;

  return Number(string);
};

/**
 * 轉換成email，如果是不合法的格式，則回傳空字串。
 *
 * @param {String} value - 來源字串
 * @returns {String} result
 */
to.email = (value) => {
  const string = to.normalString(value);

  return (is.email(string)) ? string : '';
};

/**
 * 轉換成mongoID，如果是不合法的格式，則回傳空字串。
 *
 * @param {String} value - 來源字串
 * @returns {String} result
 */
to.mongoID = (value) => {
  const string = to.string(value);

  return (/^(0x|0h)?[0-9A-F]+$/i.test(string) && string.length === 24) ? string : '';
};

/**
 * 轉換成url，如果是不合法的格式，則回傳空字串。
 */
to.url = (value) => {
  const str = to.string(value);

  if (is.url(str)) return str;
  return '';
};

/**
 * 轉換成Boolean，預設除了1,'1','true',或true，都返回false
 *
 * - 參數:
 *  - str: 來源字、數字、Boolean
 *  - restrict: 如果是false，除了0,'0','false',false,或''，其餘都返回true。預設true。
 *
 * @param {String|Number|Boolean} value - 來源字、數字、Boolean
 * @param {Boolean=} restrict - 如果是false，除了0,'0','false',false,或''，其餘都返回true。預設true。
 * @returns {Boolean} result
 */
to.boolean = (value, restrict = true) => {
  if (is.nullOrUndefined(value)) return false;

  const str = to.string(value);
  if (restrict) {
    return str === '1' || /^true$/i.test(str);
  }

  return str !== '0' && !/^false$/i.test(str) && str !== '';
};

/**
 * 轉換成json，轉換出來的物件會是原物件的deep copy。失敗的話會回傳null。
 *
 * @param {Object|String} value - 來源物件或字串
 * @return {Object} result
 */
to.json = (value) => {
  try {
    if (is.string(value)) return JSON.parse(value);
    return JSON.parse(JSON.stringify(value));
  } catch (e) {
    return null;
  }
};

/**
 * 轉換成Array，轉換出來的物件會是原物件的deep copy。如果不是Array的話會回傳null。
 *
 * @param {Array|String} value - 來源Array或字串
 * @return {Array} result
 */
to.array = (value) => {
  const tmp = to.json(value);
  if (!is.array(tmp)) return null;
  return tmp;
};

/**
 * 過濾掉危險的Regex，用來保護資料庫避免惡意query。
 *
 * @param {String} value - 來源字串
 * @return {String} result
 */
to.escapeRegex = (value) => to.string(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 將 <, >, &, ', " 以及 / 取代成HTML編碼
 *
 * @param {String} str - 來源字串
 * @return {String} result
 */
to.escape = (str) => to.string(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\//g, '&#x2F;')
  .replace(/\\/g, '&#x5C;')
  .replace(/`/g, '&#96;');

/**
 * 將字串裡的全形字轉為半形字
 *
 * @param {String} value - 來源字串
 */
to.SBC = (value) => {
  let result = '';
  const _str = to.string(value);
  const len = _str.length;
  for (let i = 0; i < len; i += 1) {
    let cCode = _str.charCodeAt(i);
    // 全形與半形相差（除空格外）：65248（十進位制）
    cCode = cCode >= 0xff01 && cCode <= 0xff5e ? cCode - 65248 : cCode;
    // 處理空格
    cCode = cCode === 0x03000 ? 0x0020 : cCode;
    result += String.fromCharCode(cCode);
  }
  return result;
};

/**
 * 將經緯度的字串轉成經緯度的物件
 * 例如：{ lat: 22.1111, lng: 120.1111}
 *
 * @param {String} value - 經緯度字串，例如：22.123,123.333
 * @returns {Object} result
 */
to.latlng = (value) => {
  const [lat, lng] = value.split(',');
  const _lat = to.number(lat);
  const _lng = to.number(lng);
  try {
    if (Number.isNaN(_lat)) throw new Error('Invalid latitude.');
    if (_lat < -90 || _lat > 90) throw new Error('Invalid latitude.');
    if (Number.isNaN(_lng)) throw new Error('Invalid longitude.');
    if (_lng < -180 || _lng > 180) throw new Error('Invalid longitude.');
  } catch (e) {
    return {};
  }

  return { lat: _lat, lng: _lng };
};

to.date = (value, format = 'YYYY-MM-DD', strict = true) => {
  const str = to.string(value);
  return (dayjs.isValid(str, strict, format)) ? str : '';
};

to.datetime = (value, format = 'YYYY-MM-DD HH:mm:ss', strict = true) => {
  const str = to.string(value);
  return (dayjs.isValid(str, strict, format)) ? str : '';
};

module.exports = to;
