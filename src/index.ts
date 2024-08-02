import { createBrowser, setupPage } from '@/lib/puppeteer'

const main = async () => {
	const browser = await createBrowser()
	const page = await setupPage(browser)

	await page.goto('https://google.com')

	await browser.close()
}

main()
