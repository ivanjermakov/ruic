import { OperatorFunction } from '../signal'
import { take } from './take'

export function first<T>(): OperatorFunction<T, T> {
    return v => take<T>(1)(v)
}
