import { echoAuth, echoBase } from './executor'

interface IAuth {
	accessToken: string
}
interface IUser {}
type TypeLogin = {
	recaptchaToken: string
}
type TypeRegister = any
type TypeUserUpdate = {}
type TypeFileUpload = {}

class AuthService {
	private _URL = '/auth'

	async login(data: TypeLogin) {
		const response = await echoBase.post<IAuth>(`${this._URL}/login`, data, {
			headers: {
				recaptcha: data.recaptchaToken
			}
		})

		const accessToken = response.data.accessToken
		// saveAccessToken(accessToken)
		// authStore().LogIn()

		return response
	}

	async register(data: TypeRegister) {
		const response = await echoBase.post<IAuth>(`${this._URL}/register`, data, {
			headers: {
				recaptcha: data.recaptchaToken
			}
		})

		const accessToken = response.data.accessToken
		// saveAccessToken(accessToken)
		// authStore().LogIn()

		return response
	}

	async logout() {
		const { data } = await echoBase.post<boolean>(`${this._URL}/logout`)
		if (data) {
			// removeAccessToken()
			// authStore().LogOut()
		}

		return data
	}
}

export const authService = new AuthService()

class UserService {
	private _URL = '/users'

	getProfile() {
		return echoAuth.get<IUser>(`${this._URL}/profile`)
	}

	putProfile(data: TypeUserUpdate) {
		return echoAuth.put<boolean>(`${this._URL}/profile`, data)
	}
}

export const userService = new UserService()

class FileService {
	private _URL = '/upload-file'

	upload(file: FormData, folder?: string) {
		return echoAuth.post<TypeFileUpload[]>(`${this._URL}`, file, {
			params: { folder }
		})
	}
}

export const fileService = new FileService()
