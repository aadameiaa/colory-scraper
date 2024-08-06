import { Page } from 'puppeteer'

import { DULUX_URL } from '@/lib/constants'
import { Color } from '@/lib/types'
import { delay, writeJSONFile } from '@/lib/utils'

export async function scrapDuluxColors(page: Page) {
	await page.goto(DULUX_URL, { waitUntil: 'networkidle2' })

	await page.locator(':scope >>> ::-p-text(Reject All)').click()

	const paletteIds = await page.evaluate(() =>
		Array.from(document.querySelectorAll('.a20-color-box.js-color-box')).map(
			(element) => element.getAttribute('data-id'),
		),
	)

	let colors: Color[] = []
	for (let index = 1; index < paletteIds.length - 1; index++) {
		const paletteId = paletteIds[index]
		const colorsInPage = await page.evaluate(async () => {
			async function extractPalette(element: Element): Promise<Color> {
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

			const data: Color[] = await Promise.all(
				colorElements.map(async (element) => await extractPalette(element)),
			)

			return data
		})

		colors = [...colors, ...colorsInPage]

		await delay(1000)
		await page.locator(`[data-id="${paletteId}"]`).click()
		await page.waitForNavigation({ waitUntil: 'networkidle2' })
	}

	writeJSONFile('dulux-colors.json', colors)
}
