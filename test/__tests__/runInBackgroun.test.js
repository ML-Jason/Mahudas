const getApp = require('../index');

let app;
beforeAll(async () => {
  app = await getApp();
});
afterAll(async () => {
  await app.close();
});

describe('runInBackground測試', () => {
  test('傳入async function', (done) => {
    const ctx = app.newContext();

    const fn = async (p1, p2) => {
      const output = `${p1},${p2}`;
      try {
        expect(output).toBe('a,b');
        done();
      } catch (err) {
        done(err);
      }
      return output;
    };

    ctx.runInBackground(fn, ['a', 'b']);
  });

  test('傳入Promise', (done) => {
    const ctx = app.newContext();

    const fn = async (p1, p2) => {
      const output = `${p1},${p2}`;
      try {
        expect(output).toBe('c,d');
        done();
      } catch (err) {
        done(err);
      }
      return output;
    };

    ctx.runInBackground(fn('c', 'd'));
  });

  test('捕捉錯誤', (done) => {
    const ctx = app.newContext();
    app.on('onBackgroundError', (e) => {
      try {
        expect(e.message).toBe('some error');
        done();
      } catch (err) {
        done(err);
      }
    });
    const fn = async () => {
      throw new Error('some error');
    };
    ctx.runInBackground(fn());
  });
});
