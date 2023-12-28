import { OperatorFunction } from '../signal'

export function filter<T>(fn: (value: T) => boolean): OperatorFunction<T, T> {
    return v => {
        if (fn(v) === true) {
            return { type: 'value', value: v }
        }
        return { type: 'consumed' }
    }
}
