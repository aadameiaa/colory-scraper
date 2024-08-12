import { Page } from 'puppeteer'

import { JOTUN_API, JOTUN_TOTAL_PAGE, JOTUN_URL } from '@/lib/constants'
import { Color } from '@/lib/types'
import { delay, isElementExist, writeJSONFile } from '@/lib/utils'

export async function scrapJotunColors(page: Page) {
	await page.goto(JOTUN_URL, { waitUntil: 'networkidle2' })

	await page.locator(':scope >>> ::-p-text(Reject All)').click()

	await delay(1000)
	await page.locator(':scope >>> ::-p-text(Hapus pencarian)').click()

	for (
		let index = 0;
		index < JOTUN_TOTAL_PAGE &&
		(await isElementExist(page, ':scope >>> ::-p-text(Muat lebih banyak)'));
		index++
	) {
		await page.locator(':scope >>> ::-p-text(Muat lebih banyak)').click()

		await page.waitForResponse(
			(response) =>
				response.url().startsWith(JOTUN_API) && response.status() === 200,
		)
	}

	const colors: Color[] = await page.evaluate(async () => {
		async function extractColor(element: Element): Promise<Color> {
			const { capitalize, computedBackgroundToHexCode } = window as any
			const color: Color = {
				brand: 'Jotun',
				name: await capitalize(
					(
						element.querySelector(
							'[class^="ColourListstyles__NameWrap-sc"]',
						) as Element
					).textContent as string,
				),
				code: (
					element.querySelector(
						'[class^="ColourListstyles__ColourCode-sc"]',
					) as Element
				).textContent as string,
				hexCode: await computedBackgroundToHexCode(
					getComputedStyle(
						element.querySelector(
							'[class^= "ColourListstyles__ColourBlock-sc"]',
						) as Element,
					),
				),
			}

			return color
		}

		const colorElements = Array.from(
			document.querySelectorAll('[class^="ColourListstyles__Colour-sc"]'),
		)

		const colors: Color[] = await Promise.all(
			colorElements.map(async (element) => await extractColor(element)),
		)

		return colors
	})

	writeJSONFile('jotun-colors.json', colors)
}
