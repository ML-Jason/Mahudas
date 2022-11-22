const request = require('supertest');
const getApp = require('../index');

let app;
beforeAll(async () => {
  app = await getApp();
});
afterAll(() => {
  app.close();
});

describe('測試Router與Controller與Middleware', () => {
  // 透過middleware.payload將jwtPayload傳遞給ctx.state
  test('Middleware傳遞ctx.state', async () => {
    const res = await request(app.server)
      .get('/get_payload')
      .expect(200);
    expect(res.body.email).toBe('mahudas@test.com');
  });

  test('404沒有頁面', async () => {
    await request(app.server)
      .get('/404')
      .expect(404);
  });

  // 測試巢狀controller是否存取正確
  // 將post帶入的參數直接回傳
  test('巢狀Controller測試', async () => {
    const res = await request(app.server)
      .post('/echo')
      .send({ msg: 'this is a echo' })
      .expect(200);
    expect(res.text).toBe('this is a echo');
  });

  test('測試public目錄', async () => {
    const res = await request(app.server)
      .get('/public.txt')
      .expect(200);
    expect(res.text).toBe('this is a public file');
  });
});
