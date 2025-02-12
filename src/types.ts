export type ValueOf<T> = T[keyof T]

// ----Enum

export const EchoMethod = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	PATCH: 'PATCH',
	DELETE: 'DELETE'
} as const
export type EchoMethod = ValueOf<typeof EchoMethod>

export const EchoResponseType = {
	JSON: 'json',
	TEXT: 'text',
	ARRAY_BUFFER: 'arrayBuffer',
	BLOB: 'blob',
	BYTES: 'bytes',
	FORM_DATA: 'formData',
	STREAM: 'stream',
	ORIGINAL: 'original'
} as const
export type EchoResponseType = ValueOf<typeof EchoResponseType>

export const EchoInterceptors = {
	REQUEST: 'request',
	RESPONSE: 'response'
} as const
export type EchoInterceptors = ValueOf<typeof EchoInterceptors>

// ----Const

export type EchoSearchParams = {
	[key: string]:
		| string
		| number
		| boolean
		| null
		| undefined
		| Array<string | number | boolean | null | undefined>
}

// ----Config

export type EchoConfig = Omit<RequestInit, 'method' | 'headers' | 'body'> & {
	method: EchoMethod
	url: string
	baseURL?: string
	params?: EchoSearchParams
	headers?: Record<string, string>
	responseType?: EchoResponseType
	body?: any
}
export type EchoCreateConfig = Omit<EchoConfig, 'url' | 'method'>

// ----Request

export type EchoRequest = Omit<EchoConfig, 'baseURL' | 'params'>
export type EchoRequestOptions = EchoCreateConfig

// ----Response

export type EchoResponse<T = any> = {
	data: T
	status: number
	statusText: string
	headers: Record<string, string>
	config: EchoConfig
}

// ----Interceptors

type Interceptor<T> = {
	onFulfilled: (value: T) => T | Promise<T>
	onRejected?: null | ((error: any) => any)
}

type InterceptorMap<T> = Map<string, Interceptor<T>>

export type EchoRequestInterceptors = InterceptorMap<EchoConfig>
export type EchoResponseInterceptors = InterceptorMap<EchoResponse>

// ----Instance

export type EchoClientInstance = {
	request: <T>(config: EchoConfig) => Promise<EchoResponse<T>>
	get: <T>(url: string, options?: EchoCreateConfig) => Promise<EchoResponse<T>>
	post: <T>(
		url: string,
		body?: any,
		options?: EchoCreateConfig
	) => Promise<EchoResponse<T>>
	put: <T>(
		url: string,
		body?: any,
		options?: EchoCreateConfig
	) => Promise<EchoResponse<T>>
	patch: <T>(
		url: string,
		body?: any,
		options?: EchoCreateConfig
	) => Promise<EchoResponse<T>>
	delete: <T>(
		url: string,
		options?: EchoCreateConfig
	) => Promise<EchoResponse<T>>
}

export type EchoInstance = EchoClientInstance & {
	interceptors: {
		request: {
			use: (
				key: string,
				onFulfilled?:
					| ((value: EchoConfig) => EchoConfig | Promise<EchoConfig>)
					| null
					| undefined,
				onRejected?: ((error: any) => any) | null | undefined
			) => void
			eject: (key: string) => boolean
			clear: () => void
		}
		response: {
			use: (
				key: string,
				onFulfilled?:
					| ((value: EchoResponse) => EchoResponse | Promise<EchoResponse>)
					| null
					| undefined,
				onRejected?: ((error: any) => any) | null | undefined
			) => void
			eject: (key: string) => boolean
			clear: () => void
		}
	}
}
