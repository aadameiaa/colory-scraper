import { createBrowser, setupPage } from '@/lib/puppeteer'
import {
	scrapDulux,
	scrapJotun,
	scrapNipponPaint,
	scrapNoDrop,
} from '@/lib/scraper'

const main = async () => {
	const browser = await createBrowser()
	const page = await setupPage(browser)

	await scrapNoDrop(page)
	await scrapNipponPaint(page)
	await scrapJotun(page)
	await scrapDulux(page)

	await browser.close()
}

main()
