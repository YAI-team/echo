export type ValueOf<T> = T[keyof T]

// ----Enum

export const EchoEnumMethod = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	PATCH: 'PATCH',
	DELETE: 'DELETE'
} as const
export type EchoEnumMethod = ValueOf<typeof EchoEnumMethod>

export const EchoEnumResponseType = {
	JSON: 'json',
	TEXT: 'text',
	STREAM: 'stream',
	DOCUMENT: 'document',
	ARRAY_BUFFER: 'arraybuffer',
	BLOB: 'blob',
	ORIGINAL: 'original'
} as const
export type EchoEnumResponseType = ValueOf<typeof EchoEnumResponseType>

export const EchoEnumInterceptors = {
	REQUEST: 'request',
	RESPONSE: 'response',
	ERROR: 'error'
} as const
export type EchoEnumInterceptors = ValueOf<typeof EchoEnumInterceptors>

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
	method: EchoEnumMethod
	url: string
	baseURL?: string
	params?: EchoSearchParams
	headers?: Record<string, string>
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

type InterceptorMap<T> = Map<number, (value: T) => T | Promise<T>>

export type EchoInterceptors = {
	request: InterceptorMap<EchoConfig>
	response: InterceptorMap<EchoResponse>
	error: InterceptorMap<any>
}

export type EchoHandlerInterceptors<T extends keyof EchoInterceptors> =
	EchoInterceptors[T] extends InterceptorMap<infer H>
		? (value: H) => H | Promise<H>
		: never
