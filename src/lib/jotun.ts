import { Page } from 'puppeteer'

import { JOTUN_API, JOTUN_TOTAL_PAGE, JOTUN_URL } from '@/lib/constants'
import { Color, RGB } from '@/lib/types'
import { delay, isElementExist, writeJSONFile } from '@/lib/utils'

export async function scrapJotunColor(page: Page) {
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

	const colors: Color[] = await page.evaluate(() => {
		function capitalize(name: string): string {
			return name
				.split(' ')
				.map(
					(word) =>
						word.charAt(0).toUpperCase() +
						word.slice(1, word.length).toLowerCase(),
				)
				.join(' ')
		}

		function rgbToHexCode({ r, g, b }: RGB): string {
			return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`.toUpperCase()
		}

		function computedBackgroundToRGB(style: string): RGB {
			const [r, g, b] = style.split(')')[0].split('(')[1].split(' ')

			return { r: parseInt(r), g: parseInt(g), b: parseInt(b) }
		}

		const colorElements = Array.from(
			document.querySelectorAll('[class^="ColourListstyles__Colour-sc"]'),
		)

		const data: Color[] = colorElements.map((colorElement) => {
			const nameElement = colorElement.querySelector(
				'[class^="ColourListstyles__NameWrap-sc"]',
			)
			const codeElement = colorElement.querySelector(
				'[class^="ColourListstyles__ColourCode-sc"]',
			)
			const hexCodeElement = colorElement.querySelector(
				'[class^= "ColourListstyles__ColourBlock-sc"]',
			)

			return {
				brand: 'Jotun',
				product: '',
				name: nameElement ? capitalize(nameElement.textContent as string) : '',
				code: codeElement ? (codeElement.textContent as string) : '',
				hexCode: hexCodeElement
					? rgbToHexCode(
							computedBackgroundToRGB(
								getComputedStyle(hexCodeElement).background,
							),
						)
					: '',
			}
		})

		return data
	})

	writeJSONFile('jotun-colors.json', colors)
}
