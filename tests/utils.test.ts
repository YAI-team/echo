import { resolveBody, resolveMerge, resolveParams, resolveURL } from 'src/utils'

describe('utils', () => {
	describe('resolveMerge', () => {
		test('должен объединять простые объекты', () => {
			const target = { a: 1, b: 2 }
			const source = { b: 3, c: 4 }
			const result = resolveMerge(target, source)

			expect(result).toEqual({ a: 1, b: 3, c: 4 })
			expect(target).toEqual({ a: 1, b: 2 })
			expect(source).toEqual({ b: 3, c: 4 })
		})

		test('должен объединять вложенные объекты', () => {
			const target = { a: { b: 1 } }
			const source = { a: { c: 2 } }
			const result = resolveMerge(target, source)

			expect(result).toEqual({ a: { b: 1, c: 2 } })
			expect(result.a).not.toBe(target.a)
			expect(result.a).not.toBe(source.a)
		})

		test('должен объединять объекты с массивами', () => {
			const target = { a: [1, 2], b: { x: 10 } }
			const source = { a: [3, 4], b: { y: 20 }, c: 5 }

			const result = resolveMerge(target, source)

			expect(result).toEqual({
				a: [3, 4],
				b: { x: 10, y: 20 },
				c: 5
			})
			expect(result.a).not.toBe(target.a)
			expect(result.a).not.toBe(source.a)
			expect(result.b).not.toBe(target.b)
			expect(result.b).not.toBe(source.b)
		})

		test('должен корректно обрабатывать объекты Date', () => {
			const date = new Date('2023-01-01')
			const target = { d: new Date() }
			const source = { d: date }
			const result = resolveMerge(target, source)

			expect(result.d).toEqual(date)
			expect(result.d).not.toBe(date)
		})

		test('должен корректно обрабатывать объекты Map', () => {
			const target = { map: new Map([['key1', 'value1']]) }
			const source = { map: new Map([['key2', 'value2']]) }
			const result = resolveMerge(target, source)

			expect(Array.from(result.map.entries())).toEqual([['key2', 'value2']])
			expect(result.map).not.toBe(source.map)
		})

		test('должен корректно обрабатывать объекты Set', () => {
			const target = { set: new Set([1, 2]) }
			const source = { set: new Set([3, 4]) }
			const result = resolveMerge(target, source)

			expect(Array.from(result.set)).toEqual([3, 4])
			expect(result.set).not.toBe(source.set)
		})

		test('должен корректно обрабатывать FormData', () => {
			const target = { form: new FormData() }
			target.form.append('field1', 'value1')

			const source = { form: new FormData() }
			source.form.append('field2', 'value2')

			const result = resolveMerge(target, source)

			expect(result.form).toBe(source.form)
		})

		test('должен не изменять исходные объекты', () => {
			const target = { a: { b: 1 }, c: new Set([1, 2]) }
			const source = { a: { d: 2 }, c: new Set([3, 4]) }

			const targetCopy = structuredClone(target)
			const sourceCopy = structuredClone(source)

			resolveMerge(target, source)

			expect(target).toEqual(targetCopy)
			expect(source).toEqual(sourceCopy)
		})

		test('должен работать с FormData', () => {
			const target = { a: 1 }
			const source = { b: new FormData() }

			const result = resolveMerge(target, source)

			expect(result.b).toBeInstanceOf(FormData)
		})
	})

	describe('resolveURL', () => {
		test('Разрешать URL', () => {
			const baseURL = 'https://example.com'
			const url = '/api/v1/resource'

			const result = resolveURL(baseURL, url)

			expect(result).toBe('https://example.com/api/v1/resource')
		})

		test('Работать без baseURL', () => {
			const url = '/api/v1/resource'

			const result = resolveURL(undefined, url)

			expect(result).toBe('/api/v1/resource')
		})

		test('Работать с пустым baseURL', () => {
			const baseURL = ''
			const url = '/api/v1/resource'

			const result = resolveURL(baseURL, url)

			expect(result).toBe('/api/v1/resource')
		})

		test('Работать с некорректными URL', () => {
			const baseURL = 'https://example.com'
			const url = '/%%invalid-url'

			const result = resolveURL(baseURL, url)

			expect(result).toBe('https://example.com/%%invalid-url')
		})

		test('Удалять параметры поиска из URL', () => {
			const baseURL = 'https://example.com'
			const url = '/api/v1/resource?existing=1&search=test'

			const result = resolveURL(baseURL, url)

			expect(result).toBe('https://example.com/api/v1/resource')
		})
	})

	describe('resolveParams', () => {
		test('Конструировать query string', () => {
			const params = { search: 'test', limtest: 10 }

			const result = resolveParams(params)

			expect(result).toBe('?search=test&limtest=10')
		})

		test('Обрабатывать массивы', () => {
			const params = { tags: ['foo', 'bar'] }

			const result = resolveParams(params)

			expect(result).toBe('?tags=foo&tags=bar')
		})

		test('Игнорировать undefined и null значения', () => {
			const params = {
				search: 'test',
				tag: undefined,
				extra: null
			}

			const result = resolveParams(params)

			expect(result).toBe('?search=test')
		})

		test('Возвращать пустую строку при отсутствии параметров', () => {
			const result = resolveParams(undefined)

			expect(result).toBe('')
		})
	})

	describe('resolveBody', () => {
		test('Обрабатывать FormData', () => {
			const body = new FormData()
			body.append('file', 'data')

			const result = resolveBody(body)

			expect(result).toBeInstanceOf(FormData)
		})

		test('Обрабатывать строку', () => {
			const body = 'test body'

			const result = resolveBody(body)

			expect(result).toBe('test body')
		})

		test('Обрабатывать числовое значение', () => {
			const body = 123

			const result = resolveBody(body)

			expect(result).toBe('123')
		})

		test('Сериализовать объекты в JSON', () => {
			const body = { key: 'value' }

			const result = resolveBody(body)

			expect(result).toBe('{"key":"value"}')
		})

		test('Возвращать undefined, если тело не задано', () => {
			const result = resolveBody(undefined)

			expect(result).toBeUndefined()
		})
	})
})
