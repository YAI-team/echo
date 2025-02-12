import { EchoSearchParams } from './types'

export const resolveMerge = (
	target: Record<string, any>,
	source: Record<string, any>
): any => {
	const output = { ...target }
	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key))
			if (source[key] instanceof FormData) output[key] = source[key]
			else if (
				typeof source[key] === 'object' &&
				source[key] !== null &&
				!Array.isArray(source[key])
			)
				output[key] = resolveMerge(target[key] || {}, source[key])
			else output[key] = source[key]
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

export const resolveData = (body: any): BodyInit | undefined => {
	if (!body) return
	return body instanceof FormData || typeof body === 'string'
		? body
		: JSON.stringify(body)
}
