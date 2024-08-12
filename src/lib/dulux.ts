import { Page } from 'puppeteer'

import { DULUX_URL } from '@/lib/constants'
import { Color } from '@/lib/types'
import { delay, writeJSONFile } from '@/lib/utils'

export async function scrapDuluxColors(page: Page) {
	await page.goto(DULUX_URL, { waitUntil: 'networkidle2' })

	await page.locator(':scope >>> ::-p-text(Reject All)').click()

	const paletteIds = await page.evaluate(() =>
		Array.from(
			document.querySelectorAll('[data-component="a20-color-box"]'),
		).map((element) => element.getAttribute('data-id')),
	)

	let colors: Color[] = []
	for (let index = 0; index < paletteIds.length; index++) {
		await delay(1000)

		const paletteId = paletteIds[index]
		index > 0 && (await page.locator(`[data-id="${paletteId}"]`).click())
		index > 0 &&
			(await page.waitForNavigation({ waitUntil: 'domcontentloaded' }))

		const colorsInPage = await page.evaluate(async () => {
			async function extractColor(element: Element): Promise<Color> {
				const color: Color = {
					brand: 'Dulux',
					name: element.getAttribute('data-label') as string,
					hexCode: element.getAttribute('data-hex') as string,
				}

				return color
			}

			const colorElements = Array.from(
				document.querySelectorAll('[data-component="m7-color-card"]'),
			)

			const colors: Color[] = await Promise.all(
				colorElements.map(async (element) => await extractColor(element)),
			)

			return colors
		})

		colors = [...colors, ...colorsInPage]
	}

	writeJSONFile('dulux-colors.json', colors)
}
