import { EchoClient } from './client'
import {
	type EchoConfig,
	type EchoCreateConfig,
	EchoEnumInterceptors,
	type EchoHandlerInterceptors,
	type EchoInterceptors,
	type EchoResponse
} from './types'
import { resolveMerge } from './utils'

export type EchoInstance = Echo

export class Echo extends EchoClient {
	createSimple(createConfig: EchoCreateConfig) {
		const request = async <T>(config: EchoConfig): Promise<EchoResponse<T>> =>
			this.client<T>(resolveMerge(createConfig, config))

		return this.methods(request)
	}

	create(createConfig: EchoCreateConfig = {}) {
		const interceptors: EchoInterceptors = {
			request: new Map(),
			response: new Map(),
			error: new Map()
		}

		const addInterceptor = <T extends EchoEnumInterceptors>(
			type: T,
			id: number,
			handler: EchoHandlerInterceptors<T>
		) => {
			const map = interceptors[type] as Map<number, EchoHandlerInterceptors<T>>
			if (map.has(id))
				throw new Error(
					`Echo error: Interceptor ${type} with id ${id} already exists.`
				)

			map.set(id, handler)

			const sortedEntries = new Map(
				Array.from(interceptors.request.entries()).sort(([a], [b]) => a - b)
			) as (typeof interceptors)[T]
			interceptors[type] = sortedEntries
		}

		const runInterceptors = async <T>(
			type: EchoEnumInterceptors,
			input: T
		): Promise<T> => {
			if (type === 'error' && interceptors[type].size === 0) {
				throw input
			}

			for (const [_, handler] of interceptors[type]) {
				try {
					input = await handler(input)
				} catch (err) {
					throw err
				}
			}
			return input
		}

		const request = async <T>(config: EchoConfig): Promise<EchoResponse<T>> => {
			const interceptedRequest = await runInterceptors<EchoConfig>(
				'request',
				resolveMerge(createConfig, config)
			)

			try {
				const response = await this.client<T>(interceptedRequest)
				return await runInterceptors<EchoResponse<T>>('response', response)
			} catch (err) {
				return await runInterceptors<any>('error', err)
			}
		}

		return {
			...this.methods(request),
			interceptors: {
				request: {
					use: (
						order: number,
						onFulfilled?:
							| ((value: EchoConfig) => EchoConfig | Promise<EchoConfig>)
							| null
					) => {
						if (onFulfilled) addInterceptor('request', order, onFulfilled)
					},
					eject: (order: number) => interceptors.request.delete(order),
					clear: () => {
						interceptors.request.clear()
					}
				},
				response: {
					use: (
						order: number,
						onFulfilled?:
							| ((value: EchoResponse) => EchoResponse | Promise<EchoResponse>)
							| null,
						onRejected?: ((error: any) => any | null) | null
					) => {
						if (onFulfilled) addInterceptor('response', order, onFulfilled)
						if (onRejected) addInterceptor('error', order, onRejected)
					},
					eject: (order: number) => {
						interceptors.response.delete(order)
						interceptors.error.delete(order)
					},
					clear: () => {
						interceptors.response.clear()
						interceptors.error.clear()
					}
				}
			}
		}
	}
}
