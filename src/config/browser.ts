import puppeteer, { Browser } from 'puppeteer'

let browser: Browser

const options = {
  devtools: false,
  headless: false,
  // executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--lang=uk-UA'],
}
puppeteer.launch(options)
  .then(browserInstance => {
    browser = browserInstance
  })

export function getBrowser(): Promise<Browser> {
  if (browser) {
    return Promise.resolve(browser)
  }
  else {
    return puppeteer.launch(options)
  }
}