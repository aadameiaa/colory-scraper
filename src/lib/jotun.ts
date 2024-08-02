import { Page } from 'puppeteer'

import { JOTUN_BASE_URL } from '@/lib/constants'
import { RGB } from '@/lib/types'

export async function scrapJotunColor(page: Page) {
	await page.goto(JOTUN_BASE_URL)

	const colors = await page.evaluate(() => {
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
			document.querySelectorAll('[class^="ColourGridstyles__Colour-sc"]'),
		)

		const data = colorElements.map((colorElement) => {
			const nameElement = colorElement.querySelector(
				'[class^="ColourGridstyles__NameWrap-sc"]',
			)
			const codeElement = colorElement.querySelector(
				'[class^="ColourGridstyles__ColourCode-sc"]',
			)
			const hexCodeElement = colorElement.querySelector(
				'[class^= "ColourGridstyles__ColourBlock-sc"]',
			)

			return {
				brand: 'Jotun',
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

	return colors
}
