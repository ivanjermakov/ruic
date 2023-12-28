import { OperatorFunction } from '../signal'

export function map<T, U>(fn: (value: T) => U): OperatorFunction<T, U> {
    return v => {
        return { type: 'value', value: fn(v) }
    }
}
