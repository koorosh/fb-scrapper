// @ts-ignore
import GhostAdminAPI from '@tryghost/admin-api'
import PostModel, {Post} from '../models/post'
import Handlebars from 'handlebars'


const source = `<div class="answer-post">
  <div class="answer-message">
    {{text}}
  </div>
  <div class="answer-author post-meta">
    {{author}}
  </div>
</div>`

const template = Handlebars.compile(source)

const makeMobileDocBody = (comments: any[]): any => {
  const commentCards = comments.map(comment => (
    ["html",
      {
        "html": template({
          text: comment.text,
          author: comment.author
        })
      }
    ]
  ))

  const sections = commentCards.map((_, idx) => {
    return [10,idx]
  })

  return {
    version: "0.3.1",
    atoms: [],
    cards: [
      ["hr", {}],
      ...commentCards
    ],
    markups: [],
    sections
  }
}

async function importToGhost() {

  // const api = new GhostAdminAPI({
  //   url: 'http://localhost:8888',
  //   key: '5eadb29d74169f00019ddcd2:3996da79b5ba3d0b5ab1df05e0eb36bd8803a4da2e2468071ec47af62ebf2e78',
  //   version: "v3"
  // })

  const api = new GhostAdminAPI({
    url: 'http://35.214.198.47:80',
    key: '5eaedd625a771500019316b4:f7c46a2012803cea55511e7c33e4f46ba567ad844acab7f716d92fef9e903a92',
    version: "v3"
  })

  const posts = await PostModel.find({}).exec()

  await posts.reduce(
    (prevPromise, item: Post) => {
      return prevPromise.then(() => {
        return api.posts.add({
          title: item.text,
          status: "published",
          mobiledoc: JSON.stringify(makeMobileDocBody(item.comments))
        })
      })
    },
    Promise.resolve()
  ).catch((e) => {
    console.log(e)
  })
}

importToGhost().then(() => console.log('done'))