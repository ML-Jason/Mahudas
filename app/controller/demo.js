module.exports = async (ctx) => {
  ctx.body = ctx.locals;
  ctx.body += `\nctx.service.demo.test() - ${await ctx.service.demo.test()}`;
  ctx.body += `\nctx.service.demo2.test() - ${await ctx.service.demo2.test()}`;
  ctx.body += `\nctx.service.demo3() - ${await ctx.service.demo3()}`;
  ctx.body += `\nctx.service.demo4.demo4.test() - ${await ctx.service.demo4.demo4.test()}`;
};
