import { EchoClient } from 'src/client'
import { EchoError } from 'src/error'
import { EchoConfig } from 'src/types'

global.fetch = jest.fn((url, config) =>
	Promise.resolve({
		ok: true,
		status: 200,
		statusText: 'OK',
		headers: new Headers({
			...config.headers
		}),
		json: () => Promise.resolve({ message: 'Success' }),
		text: () => Promise.resolve('Success')
	})
) as jest.Mock

describe('EchoClient', () => {
	let client: EchoClient
	let config: Partial<EchoConfig>

	beforeEach(() => {
		client = new EchoClient()
		config = {
			headers: {
				'Content-Type': 'application/json'
			}
		}
	})

	test('Инициализации', () => {
		expect(client).toBeDefined()
	})

	test('GET', async () => {
		const response = await client.get('https://example.com')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
	})

	test('POST', async () => {
		const response = await client.post('https://example.com', { key: 'value' })

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
	})

	test('PUT', async () => {
		const response = await client.put('https://example.com', { key: 'value' })

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
	})

	test('PATCH', async () => {
		const response = await client.patch('https://example.com', { key: 'value' })

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
	})

	test('DELETE', async () => {
		const response = await client.delete('https://example.com')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
	})

	test('GET (Content-Type:application/json)', async () => {
		const response = await client.get('https://example.com', config)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual({ message: 'Success' })
	})

	test('POST (Content-Type:application/json)', async () => {
		const response = await client.post(
			'https://example.com',
			{ key: 'value' },
			config
		)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual({ message: 'Success' })
	})

	test('PUT (Content-Type:application/json)', async () => {
		const response = await client.put(
			'https://example.com',
			{ key: 'value' },
			config
		)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual({ message: 'Success' })
	})

	test('PATCH (Content-Type:application/json)', async () => {
		const response = await client.patch(
			'https://example.com',
			{ key: 'value' },
			config
		)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual({ message: 'Success' })
	})

	test('DELETE (Content-Type:application/json)', async () => {
		const response = await client.delete('https://example.com', config)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual({ message: 'Success' })
	})

	test('Ошибки', async () => {
		;(global.fetch as jest.Mock).mockRejectedValueOnce(
			new Error('Network Error')
		)

		try {
			await client.get('https://example.com')
		} catch (error) {
			expect(error).toBeInstanceOf(EchoError)
			expect((error as EchoError).message).toBe('Network Error')
		}
	})

	test('Ошибка ответа', async () => {
		;(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			headers: new Headers(),
			json: () => Promise.resolve({ message: 'Server Error' }),
			text: () => Promise.resolve({ message: 'Server Error' })
		})

		try {
			await client.get('https://example.com')
		} catch (error) {
			expect(error).toBeInstanceOf(EchoError)
			expect((error as EchoError).message).toBe('Server Error')
		}
	})

	test('Отправка FormData', async () => {
		const formData = new FormData()
		formData.append('file', new Blob(['test content']), 'test.txt')

		const response = await client.post('https://example.com', formData)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
	})

	test('Отправка FormData с нестандартными заголовками', async () => {
		const formData = new FormData()
		formData.append('file', new Blob(['test content']), 'test.txt')

		const customConfig = {
			headers: {
				'X-Custom-Header': 'custom-value'
			}
		}

		const response = await client.post(
			'https://example.com',
			formData,
			customConfig
		)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
	})

	test('Пустой ответ', async () => {
		;(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: 'OK',
			headers: new Headers(),
			json: () => Promise.resolve({}),
			text: () => Promise.resolve('')
		})

		const response = await client.get('https://example.com')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('')
	})

	test('Некорректный JSON-ответ', async () => {
		;(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: 'OK',
			headers: new Headers(),
			json: () => Promise.reject(new SyntaxError('Unexpected token')),
			text: () => Promise.resolve(null)
		})

		const response = await client.get('https://example.com', config)

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toBeNull()
	})

	test('GET с параметрами URL', async () => {
		const response = await client.get('https://example.com', {
			params: { search: 'test' }
		})

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
		expect(global.fetch).toHaveBeenCalledWith(
			'https://example.com?search=test',
			expect.any(Object)
		)
	})

	test('GET с параметрами внутри URL', async () => {
		const response = await client.get('https://example.com?search=test')

		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')
		expect(global.fetch).toHaveBeenCalledWith(
			'https://example.com?search=test',
			expect.any(Object)
		)
	})

	test('GET с параметрами внутри URL и в params', async () => {
		const response = await client.get('https://example.com?existing=1', {
			params: { search: 'test' }
		})
		expect(response.status).toBe(200)
		expect(response.statusText).toBe('OK')
		expect(response.data).toEqual('Success')

		expect(global.fetch).toHaveBeenCalledWith(
			'https://example.com?search=test',
			expect.any(Object)
		)
	})

	test('Неправильный URL', async () => {
		;(global.fetch as jest.Mock).mockRejectedValueOnce(
			new Error('Network Error')
		)

		try {
			await client.get('https://invalid-url')
		} catch (error) {
			expect(error).toBeInstanceOf(EchoError)
			expect((error as EchoError).message).toBe('Network Error')
		}
	})
})
