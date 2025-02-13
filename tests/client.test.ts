import fetchMock from 'jest-fetch-mock'
import { EchoClient, EchoError, EchoResponse } from 'src/index'

fetchMock.enableMocks()

describe('EchoClient', () => {
	let client: EchoClient

	beforeEach(() => {
		client = new EchoClient({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		fetchMock.resetMocks()
	})

	test('Инициализация клиента', () => {
		expect(client).toBeDefined()
	})

	test('GET запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ message: string }> =
			await client.get('/test')

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/test',
			expect.any(Object)
		)
	})

	test('GET с некорректными параметрами', async () => {
		fetchMock.mockRejectOnce(() =>
			Promise.reject(new Error('Invalid parameters'))
		)
		await expect(
			client.get('/invalid-params', { params: { invalid: undefined } })
		).rejects.toThrow('Invalid parameters')
	})

	test('GET с query-параметрами со спецсимволами', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ message: 'Success' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/search', {
			params: { q: 'hello world', sort: 'desc' }
		})
		expect(response.status).toBe(200)
		expect(response.data).toEqual({ message: 'Success' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/search?q=hello%20world&sort=desc',
			expect.any(Object)
		)
	})

	test('GET с null и undefined параметрами', async () => {
		fetchMock.mockRejectOnce(() =>
			Promise.reject(new Error('Invalid parameters'))
		)
		await expect(
			client.get('/null-params', { params: { test: null, value: undefined } })
		).rejects.toThrow('Invalid parameters')
	})

	test('GET с параметрами URL', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ result: 'OK' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/search', { params: { q: 'test' } })
		expect(response.status).toBe(200)
		expect(response.data).toEqual({ result: 'OK' })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/search?q=test',
			expect.any(Object)
		)
	})

	test('GET без данных', async () => {
		fetchMock.mockResponseOnce('', {
			status: 204,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.get('/no-content')
		expect(response.status).toBe(204)
		expect(response.data).toBeNull()
	})

	test('GET responseType text', async () => {
		fetchMock.mockResponseOnce('Plain text response', {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		})

		const response: EchoResponse<string> = await client.get('/text', {
			responseType: 'text'
		})
		expect(response.data).toBe('Plain text response')
	})

	test('GET responseType arrayBuffer', async () => {
		const buffer = new Uint8Array([1, 2, 3, 4]).buffer

		fetchMock.mockImplementationOnce(() =>
			Promise.resolve(
				new Response(buffer, {
					status: 200,
					headers: { 'Content-Type': 'application/octet-stream' }
				})
			)
		)

		const response = await client.get('/binary', {
			responseType: 'arrayBuffer'
		})

		expect(response.status).toBe(200)
		expect(response.data).toBeInstanceOf(ArrayBuffer)
	})

	test('GET responseType blob', async () => {
		const blob = new Blob(['hello'], { type: 'text/plain' })

		fetchMock.mockImplementationOnce(() =>
			Promise.resolve(
				new Response(blob, {
					status: 200,
					headers: { 'Content-Type': 'text/plain' }
				})
			)
		)

		const response = await client.get('/blob', { responseType: 'blob' })

		expect(response.status).toBe(200)
		expect(response.data?.constructor.name).toBe('Blob')
	})

	test('POST запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ id: 1 }), {
			status: 201,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ id: number }> = await client.post(
			'/create',
			{ name: 'Test' }
		)

		expect(response.status).toBe(201)
		expect(response.data).toEqual({ id: 1 })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/create',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ name: 'Test' })
			})
		)
	})

	test('POST FormData', async () => {
		const formData = new FormData()
		formData.append('file', new Blob(['test content']), 'test.txt')

		fetchMock.mockResponseOnce('Success', {
			status: 200,
			headers: { 'Content-Type': 'text/plain' }
		})

		const response: EchoResponse<string> = await client.post(
			'/upload',
			formData
		)
		expect(response.status).toBe(200)
		expect(response.data).toBe('Success')
	})

	test('POST с нестандартными заголовками', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response = await client.post(
			'/custom-headers',
			{ test: 123 },
			{
				headers: { 'X-Custom-Header': 'test-value' }
			}
		)

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ success: true })
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.example.com/custom-headers',
			expect.objectContaining({
				headers: expect.objectContaining({ 'X-Custom-Header': 'test-value' })
			})
		)
	})

	test('PUT запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ updated: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ updated: boolean }> = await client.put(
			'/update',
			{ name: 'Test' }
		)

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ updated: true })
	})

	test('PATCH запрос', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ patched: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})

		const response: EchoResponse<{ patched: boolean }> = await client.patch(
			'/patch',
			{ name: 'Test' }
		)

		expect(response.status).toBe(200)
		expect(response.data).toEqual({ patched: true })
	})

	test('DELETE запрос', async () => {
		fetchMock.mockResponseOnce('', { status: 204 })
		const response = await client.delete('/delete')
		expect(response.status).toBe(204)
	})

	test('Обработка ошибок сети', async () => {
		const errorConfig: any = { method: 'GET', url: '/error' }
		fetchMock.mockRejectOnce(() =>
			Promise.reject(new EchoError('Network Error', errorConfig, errorConfig))
		)
		await expect(client.get('/error')).rejects.toThrow(EchoError)
	})

	test('Обработка ответа с ошибкой', async () => {
		fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not Found' }), {
			status: 404,
			statusText: 'Not Found',
			headers: { 'Content-Type': 'application/json' }
		})

		await expect(client.get('/missing')).rejects.toThrow(EchoError)
	})

	test('Обработка тайм-аута', async () => {
		const errorConfig: any = { method: 'GET', url: '/timeout' }
		fetchMock.mockImplementation(
			() =>
				new Promise((_, reject) =>
					setTimeout(
						() => reject(new EchoError('Timeout', errorConfig, errorConfig)),
						2000
					)
				)
		)
		await expect(client.get('/timeout')).rejects.toThrow('Timeout')
	})
})
