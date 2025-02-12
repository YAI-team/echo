import fetchMock from 'jest-fetch-mock'
import { Echo, EchoInstance } from 'src/echo'
import { EchoError } from 'src/index'

fetchMock.enableMocks()

describe('Echo Interceptors', () => {
	let echo: EchoInstance

	beforeEach(() => {
		echo = new Echo().create({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	test('Добавление и вызов перехватчика request', async () => {
		echo.interceptors.request.use('addRequest', config => {
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

	test('Удаление перехватчика request', async () => {
		const interceptorKey = 'deleteRequest'
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

	test('Перехватчик request при ошибке', async () => {
		echo.interceptors.request.use('errorRequest', null, async error => {
			return { data: 'Recovered from error', status: 200 }
		})

		fetchMock.mockRejectOnce(() => Promise.reject(new Error('Network Error')))

		const response = await echo.get('/error')
		expect(response.status).toBe(200)
		expect(response.data).toBe('Recovered from error')
	})

	test('Добавление и вызов перехватчика response', async () => {
		echo.interceptors.response.use('addResponse', async response => {
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

	test('Удаление перехватчика response', async () => {
		const interceptorKey = 'deleteResponse'
		echo.interceptors.response.use('deleteResponse', async response => {
			return { ...response, data: { modified: true } }
		})
		echo.interceptors.response.eject(interceptorKey)

		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await echo.get('/test')
		expect(response.status).toBe(200)
		expect(response.data).not.toEqual({ modified: true })
	})

	test('Перехватчик response при ошибке', async () => {
		echo.interceptors.response.use('errorResponse', null, async error => {
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
