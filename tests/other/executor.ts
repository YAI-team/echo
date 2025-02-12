import echo, { EchoClient, EchoClientInstance, EchoCreateConfig } from 'src'

import { setupEchoAuthInterceptors } from './interceptors'
import { API_URL, BEARER, REFRESH } from './other'

const config: EchoCreateConfig = {
	baseURL: API_URL,
	// headers: {
	// 	'Content-Type': 'application/json'
	// },
	credentials: 'include'
}

export const echoBase = new EchoClient(config)
export const echoAuth = echo.create(config)

// Для запросов с middleware, например для получения токенов при отсутствие accessToken
export const echoServer = (
	refreshToken?: string,
	accessToken?: string
): EchoClientInstance =>
	new EchoClient({
		...config,
		headers: {
			...(refreshToken && { Cookie: REFRESH(refreshToken) }),
			...(accessToken && { Authorization: BEARER(accessToken) })
		}
	})

setupEchoAuthInterceptors(echoAuth)
