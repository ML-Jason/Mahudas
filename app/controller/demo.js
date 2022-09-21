module.exports = async (ctx) => {
  ctx.body = ctx.locals;
  ctx.body += `\nctx.service.demo.test() - ${await ctx.service.demo.test()}`;
  ctx.body += `\nctx.service.demo2() - ${await ctx.service.demo2()}`;
  ctx.body += `\nctx.service.demo3.demo4.test() - ${await ctx.service.demo3.demo4.test()}`;
  ctx.body += `\nctx.service.demo3.demo4.test2() - ${await ctx.service.demo3.demo4.test2()}`;
};
