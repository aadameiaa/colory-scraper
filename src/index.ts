import { createBrowser, setupPage } from '@/lib/puppeteer'
import { computedBackgroundToHexCode } from '@/lib/utils'

const main = async () => {
	const browser = await createBrowser()
	const page = await setupPage(browser)

	await page.exposeFunction(
		'computedBackgroundToHexCode',
		computedBackgroundToHexCode,
	)

	await browser.close()
}

main()
