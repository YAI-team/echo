import fetchMock from 'jest-fetch-mock'
import { Echo, EchoError, EchoInstance } from 'src/index'

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

		const errorConfig: any = { method: 'GET', url: '/error' }
		fetchMock.mockRejectOnce(() =>
			Promise.reject(new EchoError('Network Error', errorConfig, errorConfig))
		)

		const response = await echo.get('/error')
		expect(response.status).toBe(200)
		expect(response.data).toBe('Recovered from error')
	})

	test('Несколько перехватчиков request изменяют конфигурацию по порядку', async () => {
		echo.interceptors.request.use('first', config => {
			config.headers = { ...config.headers, 'X-First': 'first' }
			return config
		})
		echo.interceptors.request.use('second', config => {
			config.headers = { ...config.headers, 'X-Second': 'second' }
			return config
		})

		fetchMock.mockResponseOnce(JSON.stringify({ message: 'OK' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		await echo.get('/order')

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/order',
			expect.objectContaining({
				headers: expect.objectContaining({
					'X-First': 'first',
					'X-Second': 'second'
				})
			})
		)
	})

	test('Несколько перехватчиков response изменяют ответ по порядку', async () => {
		echo.interceptors.response.use('first', async response => {
			// Добавляем свойство first
			response.data.first = true
			return response
		})
		echo.interceptors.response.use('second', async response => {
			// Добавляем свойство second
			response.data.second = true
			return response
		})

		fetchMock.mockResponseOnce(JSON.stringify({ message: 'OK' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await echo.get('/order')
		expect(response.data).toEqual(
			expect.objectContaining({ first: true, second: true })
		)
	})

	test('Несколько перехватчиков ошибок request — цепочка прекращается после первого успешного восстановления', async () => {
		let firstCalled = false
		let secondCalled = false
		let thirdCalled = false

		echo.interceptors.request.use('firstError', null, async error => {
			firstCalled = true
			// Возвращаем исходную ошибку — не считается обработкой
			return error
		})
		echo.interceptors.request.use('secondError', null, async error => {
			secondCalled = true
			// Возвращаем новый объект ответа — обработка успешна, можно прекращать цепочку
			return { data: 'Recovered from second interceptor', status: 200 }
		})
		echo.interceptors.request.use('thirdError', null, async error => {
			thirdCalled = true
			return { data: 'Should not reach here', status: 200 }
		})

		fetchMock.mockRejectOnce(() => Promise.reject(new Error('Network Error')))

		const response = await echo.get('/error')
		expect(response.status).toBe(200)
		expect(response.data).toBe('Recovered from second interceptor')
		expect(firstCalled).toBe(true)
		expect(secondCalled).toBe(true)
		expect(thirdCalled).toBe(false)
	})

	test('Несколько перехватчиков ошибок response — цепочка прекращается после первого успешного восстановления', async () => {
		let firstCalled = false
		let secondCalled = false
		let thirdCalled = false

		echo.interceptors.response.use('firstError', null, async error => {
			firstCalled = true
			// Не обрабатываем ошибку
			return error
		})
		echo.interceptors.response.use('secondError', null, async error => {
			secondCalled = true
			// Обрабатываем ошибку, возвращая новый ответ
			return { data: 'Recovered from second response interceptor', status: 200 }
		})
		echo.interceptors.response.use('thirdError', null, async error => {
			thirdCalled = true
			return { data: 'Should not reach here', status: 200 }
		})

		const errorConfig: any = { method: 'GET', url: '/error' }
		fetchMock.mockRejectOnce(() =>
			Promise.reject(new EchoError('Network Error', errorConfig, errorConfig))
		)

		const response = await echo.get('/error')
		expect(response.status).toBe(200)
		expect(response.data).toBe('Recovered from second response interceptor')
		expect(firstCalled).toBe(true)
		expect(secondCalled).toBe(true)
		expect(thirdCalled).toBe(false)
	})

	test('Ошибка остается необработанной, если ни один request-перехватчик не справился', async () => {
		echo.interceptors.request.use('errorHandler', null, async error => {
			// Возвращаем исходную ошибку, не обрабатывая её
			return error
		})

		fetchMock.mockRejectOnce(() => Promise.reject(new Error('Unhandled Error')))

		await expect(echo.get('/unhandled')).rejects.toThrow('Unhandled Error')
	})

	test('Ошибка остается необработанной, если ни один response-перехватчик не справился', async () => {
		echo.interceptors.response.use('errorHandler', null, async error => {
			// Возвращаем исходную ошибку, не обрабатывая её
			return error
		})

		const errorConfig: any = { method: 'GET', url: '/error' }
		fetchMock.mockRejectOnce(() =>
			Promise.reject(
				new EchoError('Unhandled EchoError', errorConfig, errorConfig)
			)
		)

		await expect(echo.get('/unhandled')).rejects.toThrow('Unhandled EchoError')
	})
})
