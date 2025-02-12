import { EchoSearchParams } from './types'

const isPlainObject = (item: unknown): item is Record<string, any> =>
	item !== null &&
	typeof item === 'object' &&
	!(
		item instanceof Date ||
		item instanceof Map ||
		item instanceof Set ||
		item instanceof FormData ||
		Array.isArray(item)
	)

// объединяет конфиги с полным копированием
export const resolveMerge = (
	target: Record<string, any>,
	source: Record<string, any>
): any => {
	return Object.entries(source).reduce(
		(acc, [key, sourceValue]) => {
			let newValue

			if (sourceValue instanceof Date) newValue = new Date(sourceValue)
			else if (sourceValue instanceof Map) newValue = new Map(sourceValue)
			else if (sourceValue instanceof Set) newValue = new Set(sourceValue)
			else if (Array.isArray(sourceValue)) newValue = [...sourceValue]
			else if (isPlainObject(sourceValue)) {
				const targetValue = isPlainObject(target[key]) ? target[key] : {}
				newValue = resolveMerge(targetValue, sourceValue)
			} else newValue = sourceValue

			return { ...acc, [key]: newValue }
		},
		{ ...target }
	)
}

// объединяет baseUrl и url
export const resolveURL = (
	baseURL: string | undefined,
	url: string
): string => {
	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) {
		return url.split('?')[0]
	}

	if (!baseURL) return url.split('?')[0]

	const urlWithoutSearch = url.split('?')[0]

	const normalizedBaseURL = baseURL.endsWith('/')
		? baseURL.slice(0, -1)
		: baseURL

	const normalizedURL = urlWithoutSearch.startsWith('/')
		? urlWithoutSearch.slice(1)
		: urlWithoutSearch

	return `${normalizedBaseURL}/${normalizedURL}`
}

// получаем params в string
export const resolveParams = (params?: EchoSearchParams) => {
	if (!params) return ''

	const searchParams = new URLSearchParams()

	for (const key in params) {
		if (Object.prototype.hasOwnProperty.call(params, key)) {
			const value = params[key]

			if (Array.isArray(value)) {
				value.forEach(item => {
					if (item !== undefined && item !== null && item !== '') {
						searchParams.append(key, item.toString())
					}
				})
			} else if (value !== undefined && value !== null && value !== '') {
				searchParams.set(key, value.toString())
			}
		}
	}

	const queryString = searchParams.toString().replace(/\+/g, '%20')
	return queryString ? `?${queryString}` : ''
}

// изменяем body от типа
export const resolveBody = (body: any): BodyInit | undefined => {
	if (!body) return
	return body instanceof FormData || typeof body === 'string'
		? body
		: JSON.stringify(body)
}
