import { EchoSearchParams } from './types'

const isObject = (item: any): item is Record<string, any> =>
	item !== null &&
	typeof item === 'object' &&
	!Array.isArray(item) &&
	!(item instanceof FormData) &&
	!(item instanceof Date) &&
	!(item instanceof Map) &&
	!(item instanceof Set)

export const resolveMerge = (
	target: Record<string, any>,
	source: Record<string, any>
): any => {
	const output = structuredClone(target)
	const clonedSource = structuredClone(source)

	for (const key in clonedSource) {
		if (!Object.prototype.hasOwnProperty.call(clonedSource, key)) continue

		const sourceValue = clonedSource[key]

		if (sourceValue instanceof FormData) output[key] = sourceValue
		else if (sourceValue instanceof Date) output[key] = new Date(sourceValue)
		else if (sourceValue instanceof Map) output[key] = new Map(sourceValue)
		else if (sourceValue instanceof Set) output[key] = new Set(sourceValue)
		else if (isObject(sourceValue)) {
			const targetValue = isObject(output[key]) ? output[key] : {}
			output[key] = resolveMerge(targetValue, sourceValue)
		} else output[key] = sourceValue
	}
	return output
}

export const resolveURL = (baseURL: string | undefined, url: string) => {
	const finalURL = baseURL ? new URL(url, baseURL).href : url
	return finalURL.split('?')[0]
}

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

	const queryString = searchParams.toString()
	return queryString ? `?${queryString}` : ''
}

export const resolveBody = (body: any): BodyInit | undefined => {
	if (!body) return
	return body instanceof FormData || typeof body === 'string'
		? body
		: JSON.stringify(body)
}
