import { EchoInstance } from 'src/echo'

import { isEchoError } from '../../src/error'

import { BEARER, getAccessToken } from './other'

export const setupEchoAuthInterceptors = (echoAuth: EchoInstance) => {
	echoAuth.interceptors.request.use('auth', config => {
		const accessToken = getAccessToken()
		if (accessToken)
			config.headers = {
				...config.headers,
				Authorization: BEARER(accessToken)
			}

		return config
	})

	echoAuth.interceptors.response.use('auth', null, async error => {
		if (isEchoError(error)) {
			const originalRequest: any = error.request
			const validRequest =
				error.response?.status === 401 &&
				(error.message === 'jwt expired' ||
					error.message === 'jwt must be provided')

			if (!originalRequest._isRetry && validRequest) {
				originalRequest._isRetry = true
				try {
					await echoAuth.request(originalRequest)
					return error
				} catch (err) {
					throw err
				}
			}
		}

		return error
	})
}
