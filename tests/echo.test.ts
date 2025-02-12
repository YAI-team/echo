import fetchMock from 'jest-fetch-mock'
import { EchoError } from 'src'
import { Echo, EchoInstance } from 'src/echo'

fetchMock.enableMocks()

describe('Echo Interceptors', () => {
	let echo: EchoInstance

	beforeEach(() => {
		echo = new Echo().create({ baseURL: 'https://api.example.com' })
		fetchMock.resetMocks()
	})

	test('Добавление и вызов перехватчика запроса', async () => {
		echo.interceptors.request.use('auth', config => {
			config.headers = { ...config.headers, Authorization: 'Bearer token' }
			return config
		})

		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await echo.get('/test')
		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/test',
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer token' })
			})
		)
	})

	test('Удаление перехватчика запроса', async () => {
		const interceptorKey = 'auth'
		echo.interceptors.request.use(interceptorKey, config => {
			config.headers = { ...config.headers, Authorization: 'Bearer token' }
			return config
		})
		echo.interceptors.request.eject(interceptorKey)

		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await echo.get('/test')
		expect(response.status).toBe(200)
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/test',
			expect.not.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer token' })
			})
		)
	})

	test('Добавление и вызов перехватчика ответа', async () => {
		echo.interceptors.response.use('modifyResponse', async response => {
			return { ...response, data: { modified: true } }
		})

		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await echo.get('/test')
		expect(response.status).toBe(200)
		expect(response.data).toEqual({ modified: true })
	})

	test('Перехватчик ответа при ошибке', async () => {
		echo.interceptors.response.use('handleError', null, async error => {
			return { data: 'Recovered from error', status: 200 }
		})

		fetchMock.mockRejectOnce(() =>
			Promise.reject(new EchoError('Network Error'))
		)

		const response = await echo.get('/error')
		expect(response.status).toBe(200)
		expect(response.data).toBe('Recovered from error')
	})
})
