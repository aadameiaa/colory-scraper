import { Page } from 'puppeteer'

import { NIPPON_PAINT_URL } from '@/lib/constants'
import { Color } from '@/lib/types'
import { writeJSONFile } from '@/lib/utils'

export async function scrapNipponPaintColors(page: Page) {
	await page.goto(NIPPON_PAINT_URL, { waitUntil: 'networkidle2' })

	const paletteIds = await page.evaluate(
		(url) =>
			Array.from(
				document.querySelectorAll(
					`div.colour-family > div.container-fluid > ul > li > a[href^="${url}"]`,
				),
			).map((element) =>
				(element.getAttribute('href') as string).replace(url, ''),
			),
		NIPPON_PAINT_URL,
	)

	let colors: Color[] = []
	for (let index = 1; index < paletteIds.length; index++) {
		const colorsInPage = await page.evaluate(async () => {
			async function extractPalette(element: Element): Promise<Color> {
				const { computedBackgroundToHexCode } = window as any
				const color: Color = {
					brand: 'Nippon Paint',
					name: (
						(element.querySelector('.card-title > a') as Element)
							.textContent as string
					).trim(),
					code: (
						(element.querySelector('.card-body > p:nth-child(3)') as Element)
							.textContent as string
					).trim(),
					hexCode: await computedBackgroundToHexCode(
						getComputedStyle(
							element.querySelector('.card-image > img') as Element,
						).background,
					),
				}

				return color
			}

			const colorElements = Array.from(document.querySelectorAll('.card'))

			const data: Color[] = await Promise.all(
				colorElements.map(
					async (colorElement) => await extractPalette(colorElement),
				),
			)

			return data
		})

		colors = [...colors, ...colorsInPage]

		const paletteId = paletteIds[index]
		await page
			.locator(
				`div.colour-family > div.container-fluid > ul > li > a[href$="${paletteId}"]`,
			)
			.click()
		await page.waitForNavigation({ waitUntil: 'networkidle2' })
	}

	writeJSONFile('nippon-paint-colors.json', colors)
}
