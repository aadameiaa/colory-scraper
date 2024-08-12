import { Page } from 'puppeteer'

import { NO_DROP_URL } from '@/lib/constants'
import { Color } from '@/lib/types'
import { isElementExist, writeJSONFile } from '@/lib/utils'

export async function scrapNoDropColors(page: Page) {
	await page.goto(NO_DROP_URL, { waitUntil: 'networkidle2' })

	let colors: Color[] = []
	while (
		await isElementExist(
			page,
			'a[onclick^="goPage"]:has(path[d="m1 9 4-4-4-4"])',
		)
	) {
		const colorsInPage = await page.evaluate(async () => {
			async function extractColor(element: Element): Promise<Color> {
				const { computedBackgroundToHexCode } = window as any
				const color: Color = {
					brand: 'No Drop',
					name: (
						element.querySelector(
							'div:nth-child(2) > p:nth-child(1)',
						) as Element
					).textContent as string,
					code: (
						element.querySelector(
							'div:nth-child(2) > p:nth-child(2)',
						) as Element
					).textContent as string,
					hexCode: await computedBackgroundToHexCode(
						getComputedStyle(
							element.querySelector('div:nth-child(1)') as Element,
						),
					),
				}

				return color
			}

			const colorElements = Array.from(
				document.querySelectorAll('[id^="warna_"]'),
			)

			const colors: Color[] = await Promise.all(
				colorElements.map(
					async (colorElement) => await extractColor(colorElement),
				),
			)

			return colors
		})

		colors = [...colors, ...colorsInPage]

		await page
			.locator('a[onclick^="goPage"]:has(path[d="m1 9 4-4-4-4"])')
			.click()
		await page.waitForNavigation({ waitUntil: 'networkidle2' })
	}

	writeJSONFile('no-drop-colors.json', colors)
}
