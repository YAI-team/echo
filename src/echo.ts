import { EchoClient } from './client'
import {
	type EchoConfig,
	type EchoCreateConfig,
	EchoInterceptors,
	EchoRequestInterceptors,
	type EchoResponse,
	EchoResponseInterceptors
} from './types'
import { resolveMerge } from './utils'

export type EchoInstance = Echo

export class Echo extends EchoClient {
	create(createConfig: EchoCreateConfig = {}) {
		const requestInterceptors: EchoRequestInterceptors = new Map()
		const responseInterceptors: EchoResponseInterceptors = new Map()

		const runInterceptors = async <T>(
			type: EchoInterceptors,
			input: T
		): Promise<T> => {
			const interceptors =
				type === 'request' ? requestInterceptors : responseInterceptors

			for (const [_, handler] of interceptors) {
				try {
					input = (await handler.onFulfilled(input as any)) as T
				} catch (err) {
					if (!handler.onRejected) throw err
					input = await handler.onRejected(err)
				}
			}
			return input
		}

		const request = async <T>(config: EchoConfig): Promise<EchoResponse<T>> => {
			const interceptedRequest = await runInterceptors<EchoConfig>(
				'request',
				resolveMerge(createConfig, config)
			)
			const { request } = this.configurator(interceptedRequest)
			const response = await this.fetch<T>(config, request)
			return await runInterceptors<EchoResponse<T>>('response', response)
		}

		return {
			request,
			...this.methods(request),
			interceptors: {
				request: {
					use: (
						key: string,
						onFulfilled?:
							| ((value: EchoConfig) => EchoConfig | Promise<EchoConfig>)
							| null,
						onRejected?: null | ((error: any) => any)
					) => {
						if (onFulfilled)
							requestInterceptors.set(key, { onFulfilled, onRejected })
					},
					eject: (key: string) => requestInterceptors.delete(key),
					clear: () => requestInterceptors.clear()
				},
				response: {
					use: (
						key: string,
						onFulfilled?:
							| null
							| ((value: EchoResponse) => EchoResponse | Promise<EchoResponse>),
						onRejected?: null | ((error: any) => any)
					) => {
						if (onFulfilled)
							responseInterceptors.set(key, { onFulfilled, onRejected })
					},
					eject: (key: string) => responseInterceptors.delete(key),
					clear: () => responseInterceptors.clear()
				}
			}
		}
	}
}
