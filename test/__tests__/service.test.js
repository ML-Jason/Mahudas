const request = require('supertest');
const getApp = require('../index');

let app;
beforeAll(async () => {
  app = await getApp();
});
afterAll(async () => {
  await app.close();
});

describe('Service測試', () => {
  // 將ctx.state.str改成大寫回傳
  test('單獨執行sevice', async () => {
    const ctx = app.newContext();
    ctx.state.str = 'small';
    const str = ctx.service.stringToUpper();
    expect(str).toBe('SMALL');
  });

  // 測試巢狀的service是否正確被呼叫
  // 將ctx.state.jwtPayload清空成{}
  test('在Controller裡執行service', async () => {
    const res = await request(app.server)
      .post('/logout')
      .expect(200);
    expect(res.body.email).toBeUndefined();
  });
});
