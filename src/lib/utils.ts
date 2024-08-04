import fs from 'fs'
import path from 'path'
import { Page } from 'puppeteer'

import { RGB } from '@/lib/types'

export async function delay(duration: number) {
	return new Promise((resolve) => setTimeout(resolve, duration))
}

export async function isElementExist(page: Page, selector: string) {
	try {
		return (await page.waitForSelector(selector, { timeout: 1000 })) !== null
	} catch {
		return false
	}
}

export function writeJSONFile(filename: string, data: any) {
	const dir = 'src/data'
	const filepath = path.join(dir, filename)

	!fs.existsSync(dir) && fs.mkdirSync(dir)
	fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8', (error) => {
		if (error) {
			console.error('Error writing file:', error)
		} else {
			console.log('File has been written')
		}
	})
}

function rgbToHexCode({ r, g, b }: RGB): string {
	return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`.toUpperCase()
}

function computedBackgroundToRGB(style: string): RGB {
	const [r, g, b] = style.split(')')[0].split('(')[1].split(' ')

	return { r: parseInt(r), g: parseInt(g), b: parseInt(b) }
}

export function computedBackgroundToHexCode(style: string): string {
	return rgbToHexCode(computedBackgroundToRGB(style))
}
