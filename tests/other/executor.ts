import echo, {
	EchoClient,
	EchoClientInstance,
	EchoCreateConfig,
	isEchoError
} from 'src'

import { setupEchoAuthInterceptors } from './interceptors'
import { API_URL, BEARER, REFRESH } from './other'

const config: EchoCreateConfig = {
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json'
	},
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

echoAuth
	.get('/users')
	.then(response => {
		console.log(response.data)
		console.log(response.status)
		console.log(response.statusText)
		console.log(response.headers)
		console.log(response.config)
		console.log(response.request)
	})
	.catch(error => {})

echoBase
	.get('/users')
	.then(response => {
		console.log(response.data)
		console.log(response.status)
		console.log(response.statusText)
		console.log(response.headers)
		console.log(response.config)
		console.log(response.request)
	})
	.catch(error => {
		console.log('Error', error.message)
		// Конфигурация запроса
		console.log(error.config)

		// Конечная конфигурация запроса
		console.log(error.request)

		// Сервер ответил на запрос с кодом выходящим за 2xx
		if (error.response) {
			console.log(error.response.data)
			console.log(error.response.status)
			console.log(error.response.headers)
		}
	})

echo.get('/user/12345').catch(error => {
	if (isEchoError(error)) {
		// Структуру ошибки не изменили
	}
})
