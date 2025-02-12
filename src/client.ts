import { EchoError, isEchoError } from './error'
import type {
	EchoConfig,
	EchoCreateConfig,
	EchoRequest,
	EchoRequestOptions,
	EchoResponse
} from './types'
import { resolveData, resolveMerge, resolveParams, resolveURL } from './utils'

export type EchoClientInstance = EchoClient

export class EchoClient {
	constructor(private readonly createConfig: EchoCreateConfig = {}) {}

	protected configurator = (configure: EchoConfig) => {
		const { baseURL, url, params, data } = configure

		const request: EchoRequest = {
			...configure,
			url: resolveURL(baseURL, url) + resolveParams(params),
			headers: { ...configure.headers }
		}

		const extConfig: EchoConfig = { ...configure }

		if (data instanceof FormData) {
			delete extConfig.headers?.['Content-Type']
		}
		const config: EchoConfig = {
			...extConfig,
			data: resolveData(data)
		}
		return { request, config }
	}

	protected fetch = async <T>(
		request: EchoRequest,
		config: EchoConfig
	): Promise<EchoResponse<T>> => {
		const fetchResponse = await fetch(request.url, config)
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
	}

	protected methods = (
		request: <T>(config: EchoConfig) => Promise<EchoResponse<T>>
	) => ({
		request,
		get: <T>(url: string, options: EchoRequestOptions = {}) => {
			request<T>({ method: 'GET', url, ...options })
		},
		post: <T>(url: string, data?: any, options: EchoRequestOptions = {}) => {
			request<T>({ method: 'POST', url, data, ...options })
		},
		put: <T>(url: string, data?: any, options: EchoRequestOptions = {}) => {
			request<T>({ method: 'PUT', url, data, ...options })
		},
		patch: <T>(url: string, data?: any, options: EchoRequestOptions = {}) => {
			request<T>({ method: 'PATCH', url, data, ...options })
		},
		delete: <T>(url: string, options: EchoRequestOptions = {}) => {
			request<T>({ method: 'DELETE', url, ...options })
		}
	})

	private clientSimple = <T>(
		configure: EchoConfig
	): Promise<EchoResponse<T>> => {
		const { request, config } = this.configurator(
			resolveMerge(this.createConfig, configure)
		)

		try {
			return this.fetch<T>(request, config)
		} catch (err: any) {
			if (isEchoError(err)) throw err

			const errorMessage = err.message || 'Unexpected error'
			throw new EchoError(errorMessage, config, request)
		}
	}

	request = this.methods(this.clientSimple).request
	get = this.methods(this.clientSimple).get
	post = this.methods(this.clientSimple).post
	put = this.methods(this.clientSimple).put
	patch = this.methods(this.clientSimple).patch
	delete = this.methods(this.clientSimple).delete
}
