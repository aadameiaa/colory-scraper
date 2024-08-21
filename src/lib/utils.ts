import { Page } from 'puppeteer'

import { RGB } from '@/lib/types'

export async function isElementExist(page: Page, selector: string) {
	try {
		return (await page.waitForSelector(selector, { timeout: 1000 })) !== null
	} catch {
		return false
	}
}

function toHex(value: number): string {
	const hex = value.toString(16)
	return hex.length === 1 ? '0' + hex : hex
}

function rgbToHexCode({ r, g, b }: RGB): string {
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function computedBackgroundToRGB({ background }: CSSStyleDeclaration): RGB {
	const [r, g, b] = background.split(')')[0].split('(')[1].split(' ')

	return { r: parseInt(r), g: parseInt(g), b: parseInt(b) }
}

export function computedBackgroundToHexCode(
	declaration: CSSStyleDeclaration,
): string {
	return rgbToHexCode(computedBackgroundToRGB(declaration))
}

export function capitalize(name: string): string {
	return name
		.trim()
		.split(' ')
		.map(
			(word) =>
				word.charAt(0).toUpperCase() + word.slice(1, word.length).toLowerCase(),
		)
		.join(' ')
}
