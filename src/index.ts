import { Echo } from './echo'

export * from './client'
export * from './error'
export * from './types'

export type EchoInstance = ReturnType<Echo['create']>

const echo = new Echo()
export default echo
