import { Page } from 'puppeteer'

import { NO_DROP_URL } from '@/lib/constants'
import { Color } from '@/lib/types'
import { writeJSONFile } from '@/lib/utils'

export async function scrapNoDropColors(page: Page) {
	await page.goto(NO_DROP_URL, { waitUntil: 'networkidle2' })

	const colors = await page.evaluate(async () => {
		const colorElements = Array.from(
			document.querySelectorAll('[id^="warna_"]'),
		)

		const data: Color[] = await Promise.all(
			colorElements.map(async (colorElement) => {
				const [hexCodeElement, textElements] = colorElement.children
				const [nameElement, codeElement] = textElements.children

				return {
					brand: 'No Drop',
					product: '',
					name: nameElement.textContent as string,
					code: codeElement.textContent as string,
					hexCode: await (window as any).computedBackgroundToHexCode(
						getComputedStyle(hexCodeElement).background,
					),
				}
			}),
		)

		return data
	})

	writeJSONFile('no-drop-colors.json', colors)
}
