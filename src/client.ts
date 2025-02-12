import { EchoError, isEchoError } from './error'
import type {
	EchoConfig,
	EchoRequest,
	EchoRequestOptions,
	EchoResponse
} from './types'
import { resolveBody, resolveParams, resolveURL } from './utils'

export type EchoClientInstance = EchoClient

export class EchoClient {
	private configurator = (configure: EchoConfig) => {
		const { baseURL, url, params, body } = configure

		const request: EchoRequest = {
			...configure,
			url: resolveURL(baseURL, url) + resolveParams(params),
			headers: { ...configure.headers }
		}

		const extConfig: EchoConfig = { ...configure }

		if (body instanceof FormData) {
			delete extConfig.headers?.['Content-Type']
		}
		const config: EchoConfig = {
			...extConfig,
			body: resolveBody(body)
		}
		return { request, config }
	}

	private fetched = async <T>(
		request: EchoRequest,
		config: EchoConfig
	): Promise<EchoResponse<T>> => {
		try {
			const fetchResponse: Response = await fetch(request.url, config)
			const { ok, status, statusText, headers, json, text } = fetchResponse

			const contentType = headers?.get('Content-Type')
			const data = contentType?.includes('application/json')
				? await json().catch(() => null)
				: await text().catch(() => null)

			const response: EchoResponse = {
				data,
				status,
				statusText,
				headers: Object.fromEntries(headers.entries()),
				config
			}

			if (!ok) {
				throw new EchoError(
					data?.message || statusText || 'Unexpected error',
					config,
					request,
					response
				)
			}

			return response
		} catch (err: any) {
			if (isEchoError(err)) throw err

			const errorMessage = err.message || 'Unexpected error'
			throw new EchoError(errorMessage, config, request)
		}
	}

	protected client = <T>(configure: EchoConfig): Promise<EchoResponse<T>> => {
		const { request, config } = this.configurator(configure)
		return this.fetched<T>(request, config)
	}

	protected methods = (
		request: <T>(config: EchoConfig) => Promise<EchoResponse<T>>
	) => ({
		request,
		get: <T>(url: string, options: EchoRequestOptions = {}) =>
			request<T>({ method: 'GET', url, ...options }),
		post: <T>(url: string, body?: any, options: EchoRequestOptions = {}) =>
			request<T>({ method: 'POST', url, body, ...options }),
		put: <T>(url: string, body?: any, options: EchoRequestOptions = {}) =>
			request<T>({ method: 'PUT', url, body, ...options }),
		patch: <T>(url: string, body?: any, options: EchoRequestOptions = {}) =>
			request<T>({ method: 'PATCH', url, body, ...options }),
		delete: <T>(url: string, options: EchoRequestOptions = {}) =>
			request<T>({ method: 'DELETE', url, ...options })
	})

	request = this.methods(this.client).request
	get = this.methods(this.client).get
	post = this.methods(this.client).post
	put = this.methods(this.client).put
	patch = this.methods(this.client).patch
	delete = this.methods(this.client).delete
}
