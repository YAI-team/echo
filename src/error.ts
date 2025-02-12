import type { EchoConfig, EchoRequest, EchoResponse } from './types'

export function isEchoError(error: any): error is EchoError {
	return (
		error instanceof EchoError ||
		(typeof error === 'object' && error?.name === 'EchoError')
	)
}

export class EchoError extends Error {
	constructor(
		public message: string,
		public config?: EchoConfig, // Не изменяемый
		public request?: EchoRequest, // Изменяемый
		public response?: EchoResponse // Изменяемый
	) {
		super(message)
		this.name = 'EchoError'
		Object.setPrototypeOf(this, new.target.prototype)
	}
}
