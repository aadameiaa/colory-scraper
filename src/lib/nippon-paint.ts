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
	for (let index = 0; index < paletteIds.length; index++) {
		const paletteId = paletteIds[index]
		index > 0 &&
			(await page
				.locator(
					`div.colour-family > div.container-fluid > ul > li > a[href$="${paletteId}"]`,
				)
				.click())
		index > 0 && (await page.waitForNavigation({ waitUntil: 'networkidle2' }))

		const colorsInPage = await page.evaluate(async () => {
			async function extractColor(element: Element): Promise<Color> {
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
						),
					),
				}

				return color
			}

			const colorElements = Array.from(document.querySelectorAll('.card'))

			const colors: Color[] = await Promise.all(
				colorElements.map(
					async (colorElement) => await extractColor(colorElement),
				),
			)

			return colors
		})

		colors = [...colors, ...colorsInPage]
	}

	writeJSONFile('nippon-paint-colors.json', colors)
}
