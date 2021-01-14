import {getPostById} from "./index";

const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
  const result = await getPostById('1648878088612189')
  ctx.body = result
  ctx.status = 200
})

app.listen(3003)