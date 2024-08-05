import { Page } from 'puppeteer'

import { NO_DROP_URL } from '@/lib/constants'
import { Color } from '@/lib/types'
import { isElementExist, writeJSONFile } from '@/lib/utils'

export async function scrapNoDropColors(page: Page) {
	await page.goto(NO_DROP_URL, { waitUntil: 'networkidle2' })

	let colors: Color[] = []
	for (
		let index = 2;
		await isElementExist(page, `[onclick="goPage(${index})"]`);
		index++
	) {
		const colorsInPage = await page.evaluate(async () => {
			async function extractPalette(element: Element): Promise<Color> {
				const [hexCodeElement, textElements] = element.children
				const [nameElement, codeElement] = textElements.children

				const { computedBackgroundToHexCode } = window as any
				const color: Color = {
					brand: 'No Drop',
					name: nameElement.textContent as string,
					code: codeElement.textContent as string,
					hexCode: await computedBackgroundToHexCode(
						getComputedStyle(hexCodeElement).background,
					),
				}

				return color
			}

			const colorElements = Array.from(
				document.querySelectorAll('[id^="warna_"]'),
			)

			const data: Color[] = await Promise.all(
				colorElements.map(
					async (colorElement) => await extractPalette(colorElement),
				),
			)

			return data
		})

		colors = [...colors, ...colorsInPage]

		await page.locator(`[onclick="goPage(${index})"]`).click()
		await page.waitForNavigation({ waitUntil: 'networkidle2' })
	}

	writeJSONFile('no-drop-colors.json', colors)
}
