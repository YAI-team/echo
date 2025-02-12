import { EchoError, isEchoError } from './error'
import type {
	EchoConfig,
	EchoCreateConfig,
	EchoRequest,
	EchoRequestOptions,
	EchoResponse
} from './types'
import { resolveBody, resolveMerge, resolveParams, resolveURL } from './utils'

export type EchoClientInstance = EchoClient

export class EchoClient {
	constructor(private readonly createConfig: EchoCreateConfig = {}) {}

	protected configurator = (configure: EchoConfig) => {
		const { baseURL, url, params, body, headers } = configure

		const config: EchoConfig = { ...configure, headers: { ...headers } }

		const request: EchoRequest = {
			...configure,
			url: resolveURL(baseURL, url) + resolveParams(params),
			body: resolveBody(body)
		}

		if (body instanceof FormData) {
			delete request.headers?.['Content-Type']
		}

		return { request, config }
	}

	private returnResponseData = async (req: EchoRequest, res: Response) => {
		if (!req.responseType || !res.ok || req.responseType === 'original') {
			const contentType = res.headers?.get('Content-Type') || ''

			if (!req.responseType || req.responseType === 'original') {
				if (contentType.includes('application/json')) {
					return res.json().catch(() => null)
				}
				if (contentType.startsWith('text/')) {
					return res.text().catch(() => null)
				}
				if (contentType.includes('application/octet-stream')) {
					return res.arrayBuffer().catch(() => null)
				}
				return res.blob().catch(() => null)
			}
		} else {
			switch (req.responseType) {
				case 'json':
					return res.json()
				case 'text':
					return res.text()
				case 'arrayBuffer':
					return res.arrayBuffer()
				case 'blob':
					return res.blob()
				case 'bytes':
					return res.bytes()
				case 'formData':
					return res.formData()
				case 'stream':
					return res.body
				default:
					throw new Error(`Unsupported responseType: ${req.responseType}`)
			}
		}
	}

	protected fetch = async <T>(
		request: EchoRequest,
		config: EchoConfig
	): Promise<EchoResponse<T>> => {
		const fetchResponse = await fetch(request.url, request)
		const { ok, status, statusText, headers } = fetchResponse
		const data = await this.returnResponseData(request, fetchResponse)

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
			return request<T>({ method: 'GET', url, ...options })
		},
		post: <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'POST', url, body, ...options })
		},
		put: <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'PUT', url, body, ...options })
		},
		patch: <T>(url: string, body?: any, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'PATCH', url, body, ...options })
		},
		delete: <T>(url: string, options: EchoRequestOptions = {}) => {
			return request<T>({ method: 'DELETE', url, ...options })
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
