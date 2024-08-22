import puppeteer, { Browser } from 'puppeteer'

import { DEFAULT_PUPPETEER_TIMEOUT, USER_AGENT } from '@/lib/constants'
import { capitalize, computedBackgroundToHexCode } from '@/lib/utils'

export async function createBrowser() {
	return await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		devtools: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	})
}

export async function setupPage(browser: Browser) {
	const [page] = await browser.pages()

	await page.setUserAgent(USER_AGENT)

	page.setDefaultNavigationTimeout(DEFAULT_PUPPETEER_TIMEOUT)
	page.setDefaultTimeout(DEFAULT_PUPPETEER_TIMEOUT)

	await page.exposeFunction('capitalize', capitalize)
	await page.exposeFunction(
		'computedBackgroundToHexCode',
		computedBackgroundToHexCode,
	)

	return page
}
