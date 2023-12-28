import { OperatorFunction } from '../signal'

export function take<T>(n: number): OperatorFunction<T, T> {
    let i = 0
    return v => {
        i++
        if (i >= n) {
            return { type: 'completed' }
        }
        return { type: 'value', value: v }
    }
}
