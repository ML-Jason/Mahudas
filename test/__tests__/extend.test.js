const getApp = require('../index');

let app;
beforeAll(async () => {
  app = await getApp();
});
afterAll(async () => {
  await app.close();
});

describe('Extend測試 Utils.is', () => {
  // Boolean
  test('is boolean', () => {
    expect(app.utils.is.boolean(false)).toBe(true);
  });

  test('is not boolean', () => {
    expect(app.utils.is.boolean(0)).toBe(false);
  });

  // Null
  test('is null', () => {
    expect(app.utils.is.null(null)).toBe(true);
  });

  test('is not null', () => {
    expect(app.utils.is.null('')).toBe(false);
  });

  // Undefined
  test('is undefined', () => {
    expect(app.utils.is.undefined(undefined)).toBe(true);
  });

  test('is not undefined', () => {
    expect(app.utils.is.undefined('undefined')).toBe(false);
  });

  // Class
  test('is class', () => {
    class c {}
    expect(app.utils.is.class(c)).toBe(true);
  });

  test('is not class', () => {
    expect(app.utils.is.class('')).toBe(false);
  });

  // Object
  test('is object', () => {
    expect(app.utils.is.object({})).toBe(true);
  });

  test('is not object', () => {
    expect(app.utils.is.object('')).toBe(false);
  });

  // String
  test('is string', () => {
    expect(app.utils.is.string('')).toBe(true);
  });

  test('is not string', () => {
    expect(app.utils.is.string(false)).toBe(false);
  });

  // nullOrUndefined
  test('is NullOrUndefined', () => {
    expect(app.utils.is.nullOrUndefined(null)).toBe(true);
    expect(app.utils.is.nullOrUndefined(undefined)).toBe(true);
  });

  test('is not NullOrUndefined', () => {
    expect(app.utils.is.nullOrUndefined(false)).toBe(false);
  });

  // Function
  test('is function', () => {
    const func = () => {};
    expect(app.utils.is.function(func)).toBe(true);
  });

  test('is not function', () => {
    expect(app.utils.is.function(false)).toBe(false);
  });

  // Array
  test('is array', () => {
    expect(app.utils.is.array([])).toBe(true);
  });

  test('is not array', () => {
    expect(app.utils.is.array(false)).toBe(false);
  });

  // Int
  test('is int', () => {
    expect(app.utils.is.int(3)).toBe(true);
  });

  test('is not int', () => {
    expect(app.utils.is.int(3.2)).toBe(false);
  });

  // Date
  test('is date', () => {
    expect(app.utils.is.date(new Date())).toBe(true);
  });

  test('is not date', () => {
    expect(app.utils.is.date('')).toBe(false);
  });

  // Error
  test('is error', () => {
    expect(app.utils.is.error(new Error())).toBe(true);
  });

  test('is not array', () => {
    expect(app.utils.is.array('')).toBe(false);
  });

  // Email
  test('is email', () => {
    expect(app.utils.is.email('mahudas@mahudas.com')).toBe(true);
  });

  test('is not email', () => {
    expect(app.utils.is.email('mahudas@ma')).toBe(false);
  });

  // IP
  test('is ip', () => {
    expect(app.utils.is.ip('127.0.0.1')).toBe(true);
  });

  test('is not ip', () => {
    expect(app.utils.is.ip(false)).toBe(false);
  });

  // Url
  test('is url', () => {
    expect(app.utils.is.url('http://127.0.0.1')).toBe(true);
  });

  test('is not url', () => {
    expect(app.utils.is.url('ws://127.0.0.1')).toBe(false);
  });
});

describe('Extend測試 Utils.to', () => {
  // String
  test('to String', () => {
    expect(app.utils.to.string(false)).toBe('false');
  });

  test('to String Empty', () => {
    expect(app.utils.to.string(null)).toBe('');
  });

  // Alphanumeric
  test('to Alphanumeric', () => {
    expect(app.utils.to.alphanumeric('hello')).toBe('hello');
  });

  test('to Alphanumeric Empty', () => {
    expect(app.utils.to.alphanumeric('\\hello')).toBe('');
  });

  // NormalString
  test('to NormalString', () => {
    expect(app.utils.to.normalString('@hello')).toBe('@hello');
  });

  test('to NormalString Empty', () => {
    expect(app.utils.to.normalString('\\hello')).toBe('');
  });

  // Number
  test('to Number', () => {
    expect(app.utils.to.number('1234')).toBe(1234);
  });

  test('to Number Empty', () => {
    expect(app.utils.to.number('\\hello')).toBe(Number.NaN);
  });

  // Email
  test('to Email', () => {
    expect(app.utils.to.email('mahudas@mahudas.com')).toBe('mahudas@mahudas.com');
  });

  test('to Email Empty', () => {
    expect(app.utils.to.email('mahudas@ma')).toBe('');
  });

  // Url
  test('to Url', () => {
    expect(app.utils.to.url('http://127.0.0.1')).toBe('http://127.0.0.1');
  });

  test('to Url Empty', () => {
    expect(app.utils.to.url('ws://127.0.0.1')).toBe('');
  });

  // Boolean
  test('to Boolean', () => {
    expect(app.utils.to.boolean(1)).toBe(true);
    expect(app.utils.to.boolean('true')).toBe(true);
    expect(app.utils.to.boolean(0)).toBe(false);
  });

  test('to Boolean False', () => {
    expect(app.utils.to.boolean(0)).toBe(false);

    expect(app.utils.to.boolean('false', false)).toBe(false);
  });

  // JSON
  test('to JSON', () => {
    const jsonString = JSON.stringify({ foo: 'bar' });
    expect(app.utils.to.json(jsonString).foo).toBe('bar');
  });

  test('to JSON Null', () => {
    const jsonString = '{foo:bar';
    expect(app.utils.to.json(jsonString)).toBe(null);
  });

  // Array
  test('to Array', () => {
    const arrayString = JSON.stringify(['bar']);
    expect(app.utils.to.array(arrayString)[0]).toBe('bar');
  });

  test('to Array Null', () => {
    const arrayString = '{foo:bar}';
    expect(app.utils.to.json(arrayString)).toBe(null);
  });

  // SBC
  test('to SBC', () => {
    expect(app.utils.to.SBC('ＨＥＬＬＯ')).toBe('HELLO');
  });

  // latlng
  test('to latlng', () => {
    expect(app.utils.to.latlng('22.1111,121.2341').lat).toBe(22.1111);
  });

  // Date
  test('to Date', () => {
    expect(app.utils.to.date('2022-01-01')).toBe('2022-01-01');
  });

  test('to Date Empty', () => {
    expect(app.utils.to.date('2022-02-29')).toBe('');
  });

  // DateTime
  test('to DateTime', () => {
    expect(app.utils.to.datetime('2022-01-01 00:00:00')).toBe('2022-01-01 00:00:00');
  });

  test('to DateTime Empty', () => {
    expect(app.utils.to.datetime('2022-01-31 24:00:00')).toBe('');
  });
});
