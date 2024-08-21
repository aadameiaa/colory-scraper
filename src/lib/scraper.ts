import { writeFileSync } from 'fs'
import { Page } from 'puppeteer'

import {
	DULUX_URL,
	JOTUN_API,
	JOTUN_TOTAL_PAGE,
	JOTUN_URL,
	NIPPON_PAINT_URL,
	NO_DROP_URL,
} from '@/lib/constants'
import { Color } from '@/lib/types'
import { capitalize, isElementExist } from '@/lib/utils'

async function scrapDuluxColors(
	page: Page,
	pageIds: string[],
): Promise<Color[]> {
	let colors: Color[] = []

	for (const pageId of pageIds) {
		await page.goto(`${DULUX_URL}/filters/h_${capitalize(pageId)}`, {
			waitUntil: 'networkidle0',
		})

		const colorsInPage = await page.evaluate(async () => {
			async function extractColor(element: Element): Promise<Color> {
				return {
					brand: 'Dulux',
					name: element.getAttribute('data-label') as string,
					hexCode: element.getAttribute('data-hex') as string,
				}
			}

			const colorElements = Array.from(
				document.querySelectorAll('[data-component="m7-color-card"]'),
			)

			const extractedColors: Color[] = await Promise.all(
				colorElements.map(async (element) => await extractColor(element)),
			)

			return extractedColors
		})

		colors = [...colors, ...colorsInPage]
	}

	return colors
}

export async function scrapDulux(page: Page) {
	await page.goto(DULUX_URL, { waitUntil: 'networkidle0' })

	await page.locator(':scope >>> ::-p-text(Reject All)').click()

	const pageIds = (await page.evaluate(() =>
		Array.from(
			document.querySelectorAll('[data-component="a20-color-box"]'),
		).map((element) => element.getAttribute('data-id')),
	)) as string[]
	const colors = await scrapDuluxColors(page, pageIds)

	writeFileSync(
		'public/data/dulux-colors.json',
		JSON.stringify(colors, null, 2),
		'utf-8',
	)
}

async function scrapJotunColors(page: Page): Promise<Color[]> {
	const colors: Color[] = await page.evaluate(async () => {
		async function extractColor(element: Element): Promise<Color> {
			const { capitalize, computedBackgroundToHexCode } = window as any
			const color: Color = {
				brand: 'Jotun',
				name: await capitalize(
					(
						element.querySelector(
							'[class^="ColourListstyles__NameWrap-sc"]',
						) as Element
					).textContent as string,
				),
				code: (
					element.querySelector(
						'[class^="ColourListstyles__ColourCode-sc"]',
					) as Element
				).textContent as string,
				hexCode: await computedBackgroundToHexCode(
					getComputedStyle(
						element.querySelector(
							'[class^= "ColourListstyles__ColourBlock-sc"]',
						) as Element,
					),
				),
			}

			return color
		}

		const colorElements = Array.from(
			document.querySelectorAll('[class^="ColourListstyles__Colour-sc"]'),
		)

		const extractedColors: Color[] = await Promise.all(
			colorElements.map(async (element) => await extractColor(element)),
		)

		return extractedColors
	})

	return colors
}

export async function scrapJotun(page: Page) {
	await page.goto(JOTUN_URL, { waitUntil: 'networkidle0' })

	await page.locator(':scope >>> ::-p-text(Reject All)').click()
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

	const colors = await scrapJotunColors(page)

	writeFileSync(
		'public/data/jotun-colors.json',
		JSON.stringify(colors, null, 2),
		'utf-8',
	)
}

async function scrapNipponPaintColors(
	page: Page,
	pageIds: string[],
): Promise<Color[]> {
	let colors: Color[] = []

	for (const pageId of pageIds) {
		await page.goto(`${NIPPON_PAINT_URL}${pageId}/`, {
			waitUntil: 'networkidle0',
		})

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

			const extractedColors: Color[] = await Promise.all(
				colorElements.map(
					async (colorElement) => await extractColor(colorElement),
				),
			)

			return extractedColors
		})

		colors = [...colors, ...colorsInPage]
	}

	return colors
}

export async function scrapNipponPaint(page: Page) {
	await page.goto(NIPPON_PAINT_URL, { waitUntil: 'networkidle0' })

	const pageIds = await page.evaluate(
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

	const colors = await scrapNipponPaintColors(page, pageIds)

	writeFileSync(
		'public/data/nippon-paint-colors.json',
		JSON.stringify(colors, null, 2),
		'utf-8',
	)
}

async function scrapNoDropColors(page: Page): Promise<Color[]> {
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

			const extractedColors: Color[] = await Promise.all(
				colorElements.map(
					async (colorElement) => await extractColor(colorElement),
				),
			)

			return extractedColors
		})

		colors = [...colors, ...colorsInPage]

		await page
			.locator('a[onclick^="goPage"]:has(path[d="m1 9 4-4-4-4"])')
			.click()
		await page.waitForNavigation({ waitUntil: 'networkidle0' })
	}

	return colors
}

export async function scrapNoDrop(page: Page) {
	await page.goto(NO_DROP_URL, { waitUntil: 'networkidle0' })

	const colors = await scrapNoDropColors(page)

	writeFileSync(
		'public/data/no-drop-colors.json',
		JSON.stringify(colors, null, 2),
		'utf-8',
	)
}
