import puppeteer from 'puppeteer'
const OUT = 'C:/Users/amitc/AppData/Local/Temp/claude/C--Amit--Courses-02-AI-SaaS-Siddhant-CareerSetu/979a3dad-a4c1-44e9-8646-6f23198681c5/scratchpad'
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const warm = await browser.newPage()
await warm.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise(r => setTimeout(r, 3000))
await warm.close()

const pages = [
  { url: 'http://localhost:3000/try', label: 'try' },
  { url: 'http://localhost:3000/login', label: 'login' },
]
for (const pg of pages) {
  const page = await browser.newPage()
  await page.setViewport({ width: 375, height: 812 })
  await page.goto(pg.url, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 2000))
  await page.screenshot({ path: `${OUT}/check-${pg.label}.png`, fullPage: true })
  console.log(`OK ${pg.label}`)
  await page.close()
}
await browser.close()
