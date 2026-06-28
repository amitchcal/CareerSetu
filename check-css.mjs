import puppeteer from 'puppeteer'
const browser = await puppeteer.launch({ 
  headless: true, 
  args: ['--no-sandbox','--disable-dev-shm-usage','--disable-http2','--disable-web-security','--allow-running-insecure-content']
})
const page = await browser.newPage()
await page.setViewport({ width: 375, height: 812 })
const failed = []
page.on('requestfailed', req => failed.push(req.url().substring(50)))
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 45000 })
await new Promise(r => setTimeout(r, 3000))
const bgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor)
console.log('Body bg:', bgColor)
console.log('Failed count:', failed.length)
if (failed.length) console.log('Samples:', failed.slice(0, 3))
await page.screenshot({ path: 'C:/Users/amitc/AppData/Local/Temp/claude/C--Amit--Courses-02-AI-SaaS-Siddhant-CareerSetu/979a3dad-a4c1-44e9-8646-6f23198681c5/scratchpad/test-css.png', fullPage: false })
await browser.close()
