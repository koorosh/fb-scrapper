import {getBrowser} from "./config/browser";
import {Page} from "puppeteer";
import PostModel, { Post } from './models/post'
import StatsModel from './models/stats'
import { Comment, Stats } from './models'

const FB_LOGIN_URL = `https://mbasic.facebook.com/login`
const FB_GROUPS_URL = `https://mbasic.facebook.com/groups`
const groupId = '403681463131864'

const groupMessageUrl = (groupId: string, postId: string) =>
  `https://mbasic.facebook.com/groups/${groupId}?view=permalink&id=${postId}`

const login = async (page: Page) => {
  await page.goto(FB_LOGIN_URL)
  await page.type('input#m_login_email', 'email@gmail.com')
  await page.type('input[name=pass]', '<PASSWORD>')
  await page.waitForSelector('input[name=login]')
  await page.click('input[name=login]')
  await page.waitForSelector('input[type=submit][value=OK]')
  return await page.click('input[type=submit][value=OK]')
}

const seeMorePosts = async (page: Page) => {
  const nextPostsPageLink = await page.evaluate(() => {
    const el = document.querySelector<HTMLAnchorElement>('#m_group_stories_container > div > a')
    return el.href
  })
  await page.goto(nextPostsPageLink, {waitUntil: "load"})
}

const seeMoreComments = async (page: Page) => {
  const nextLink = await page.evaluate(() => {
    const el = document.querySelector<HTMLAnchorElement>('div[id^="see_prev"] > a')
    return el.href
  })
  await page.goto(nextLink, {waitUntil: "load"})
}

const hasMoreComments = (page: Page) => {
  return page.evaluate(() => {
    const prevCommentsLink = document.querySelector<HTMLAnchorElement>(
      'div[role=main] > div > div:nth-child(2) > div > div:nth-child(4) > div[id^="see_prev"] > a'
    )
    return !!prevCommentsLink
  })
}

const scrapPosts = async (page: Page) => {

  const getFullImage = () => {

  }

  const getPostMessage = (postId: string, groupId: string) => {
    return page.evaluate((_postId: string, _groupId: string) => {
      const textMessageNode = document.querySelector<HTMLDivElement>('div[data-ft*="top_level_post_id"] > div > div')

      // get media URLs
      const mediaMessageNodes = document.querySelectorAll<HTMLImageElement>('div[data-ft*="top_level_post_id"] > div > div:nth-child(3) a img')
      const mediaUrls: string[] = []
      mediaMessageNodes.forEach(i => mediaUrls.push(i.getAttribute('src')))
      const textMessage = textMessageNode ? textMessageNode.innerText : null

      // get author name
      const authorNameNode = document.querySelector<HTMLAnchorElement>('div[data-ft*="top_level_post_id"] > div > header header a')
      const author = authorNameNode.innerText

      return {
        id: _postId,
        author,
        groupId: _groupId,
        text: textMessage,
        comments: [],
        mediaUrls,
      }
    }, postId, groupId)
  }

  const getPostComments = () => {
    return  page.evaluate(() => {
      // get comments
      const commentNodes = document.querySelectorAll<HTMLDivElement>('div[role=main] > div > div:nth-child(2) > div > div:nth-child(4) > div')
      const comments: Comment[] = []

      commentNodes.forEach(node => {
        const commentAuthorNameNode = node.querySelector<HTMLAnchorElement>('div > div:nth-child(1) a')
        const commentAuthor = commentAuthorNameNode.innerText

        const commentId = node.getAttribute('id')
        const textNode = node.querySelector<HTMLAnchorElement>('div > div:nth-child(2)')
        const commentMediaUrls: string[] = []
        const commentMediaNodes = node.querySelectorAll<HTMLImageElement>('div > div:nth-child(3) img')
        commentMediaNodes.forEach(i => commentMediaUrls.push(i.getAttribute('src')))

        if (textNode && textNode.innerText) {
          comments.push({
            id: commentId,
            author: commentAuthor,
            text: textNode.innerText,
            comments: [],
            mediaUrls: commentMediaUrls,
          })
        }
      })
      return comments
    })
  }

  const results = await page.evaluate(() => {
    const nodeList = document.querySelectorAll<HTMLAnchorElement>('#m_group_stories_container article')
    let array: string[] = []
    nodeList.forEach(item => array.push(item.getAttribute('data-ft') || ''))
    return array
      .filter(a => a.length > 0)
      .map(item => JSON.parse(item))
  })

  const posts: Post[] = await results.reduce(
    (acc, item) => {
      return acc.then(async (data: Post[]) => {
        // get URL and navigate to specific post
        const groupId = item['group_id']
        const postId = item['mf_story_key']
        const targetUrl = groupMessageUrl(groupId, postId)
        await page.goto(targetUrl, {waitUntil: "load"})
        console.log('got to post', targetUrl)

        // has more comments?
        const post = await getPostMessage(postId, groupId)
        const comments: Comment[] = []
        let firstCommentsPage = true

        do {
          if (!firstCommentsPage) {
            await seeMoreComments(page)
          }
          const commentsPerPage = await getPostComments()
          comments.unshift(...commentsPerPage)
          firstCommentsPage = false
          console.log('hasMoreComments', (await hasMoreComments(page)), page.url())
        }
        while ((await hasMoreComments(page)))

        if (post.text !== null) {
          post.comments = comments
          data.push(post)
        }
        return data
      })
    },
    Promise.resolve([]),
  )

  return posts
}

const start = async (groupId: string, lastPostId: string) => {
  const browser = await getBrowser()

  const page = await browser.newPage()

  console.log('Login')
  await login(page)

  console.log('Open page', `${FB_GROUPS_URL}/${groupId}`)
  await page.goto(`${FB_GROUPS_URL}/${groupId}`, { waitUntil: "domcontentloaded" })

  let initPage = true
  let currentPageUrl = page.url()
  let scannedPostsCount = 0

  const isLastPage = async (_page: Page) => {
    const hasMorePages = await _page.evaluate(() => {
      const morePostsLink = document.querySelector<HTMLAnchorElement>(
        '#m_group_stories_container > div > a'
      )
      return !!morePostsLink
    })
    return !hasMorePages || scannedPostsCount > 1000
  }

  do {
    if (!initPage) {
      await seeMorePosts(page)
      currentPageUrl = page.url()
    }
    const nextPostPage = await scrapPosts(page)
    await page.goto(currentPageUrl, {waitUntil: 'domcontentloaded'})
    initPage = false
    await PostModel.insertMany(nextPostPage.reverse())
    console.log('url', page.url())
  } while (!(await isLastPage(page)))

  await page.close()
}

// StatsModel.findOne({})
//   .then(({lastPostId}: Stats) => {
//     return start(groupId, lastPostId)
//   })
//   .then(() => {
//     console.log('finish')
//   })


export async function getPostById(postId: string) {
  const data = []
  const browser = await getBrowser()
  const page = await browser.newPage()
  await login(page)

  const getPostMessage = (postId: string, groupId: string) => {
    return page.evaluate((_postId: string, _groupId: string) => {
      const textMessageNode = document.querySelector<HTMLDivElement>('div[data-ft*="top_level_post_id"] > div > div')

      // get media URLs
      const mediaMessageNodes = document.querySelectorAll<HTMLAnchorElement>('div[data-ft*="top_level_post_id"] > div > div:nth-child(3) a')
      const mediaUrls: string[] = []
      mediaMessageNodes.forEach(i => mediaUrls.push(i.getAttribute('src')))
      const textMessage = textMessageNode ? textMessageNode.innerText : null

      // get author name
      const authorNameNode = document.querySelector<HTMLAnchorElement>('div[data-ft*="top_level_post_id"] > div > header header a')
      const author = authorNameNode.innerText

      return {
        id: _postId,
        author,
        groupId: _groupId,
        text: textMessage,
        comments: [],
        mediaUrls,
      }
    }, postId, groupId)
  }

  const getPostComments = () => {
    return  page.evaluate(() => {
      // get comments
      const commentNodes = document.querySelectorAll<HTMLDivElement>('div[role=main] > div > div:nth-child(2) > div > div:nth-child(4) > div')
      const comments: Comment[] = []

      commentNodes.forEach(node => {
        const commentAuthorNameNode = node.querySelector<HTMLAnchorElement>('div > div:nth-child(1) a')
        const commentAuthor = commentAuthorNameNode.innerText

        const commentId = node.getAttribute('id')
        const textNode = node.querySelector<HTMLAnchorElement>('div > div:nth-child(2)')
        const commentMediaUrls: string[] = []
        const commentMediaNodes = node.querySelectorAll<HTMLImageElement>('div > div:nth-child(3) img')
        commentMediaNodes.forEach(i => commentMediaUrls.push(i.getAttribute('src')))

        if (textNode && textNode.innerText) {
          comments.push({
            id: commentId,
            author: commentAuthor,
            text: textNode.innerText,
            comments: [],
            mediaUrls: commentMediaUrls,
          })
        }
      })
      return comments
    })
  }

  const postUrl = groupMessageUrl(groupId, postId)
  await page.goto(postUrl)

  // has more comments?
  const post = await getPostMessage(postId, groupId)
  const comments: Comment[] = []
  let firstCommentsPage = true

  do {
    if (!firstCommentsPage) {
      await seeMoreComments(page)
    }
    const commentsPerPage = await getPostComments()
    comments.unshift(...commentsPerPage)
    firstCommentsPage = false
    console.log('hasMoreComments', (await hasMoreComments(page)), page.url())
  }
  while ((await hasMoreComments(page)))

  if (post.text !== null) {
    post.comments = comments
    data.push(post)
  }

  return data
}