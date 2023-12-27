import { OperatorFunction } from '../signal'
import { take } from './take'

export function first<T>(): OperatorFunction<T, T> {
    return s => s.pipe(take(1))
}
