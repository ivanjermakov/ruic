import { OperatorFunction, Signal } from '../signal'

export function map<T, U>(fn: (value: T) => U): OperatorFunction<T, U> {
    return s => {
        const t = new Signal(fn(s.get()))
        s.subscribe(v => t.set(fn(v)))
        return t
    }
}
