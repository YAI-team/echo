import { ValueOf } from 'src/types'

export const EnumTokens = {
	ACCESS_TOKEN: 'accessToken',
	REFRESH_TOKEN: 'refreshToken'
} as const
export type EnumTokens = ValueOf<typeof EnumTokens>

export const BEARER = (accessToken: string) => `Bearer ${accessToken}`
export const ACCESS = (accessToken: string) =>
	`${EnumTokens.ACCESS_TOKEN}=${accessToken}`
export const REFRESH = (refreshToken: string) =>
	`${EnumTokens.REFRESH_TOKEN}=${refreshToken}`

export const API_URL = 'https://jsonplaceholder.typicode.com'

export const getAccessToken = () => 'accessToken'
