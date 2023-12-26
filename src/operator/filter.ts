import { OperatorFunction, Signal } from '../signal'

export function filter<T>(fn: (value: T) => boolean): OperatorFunction<T, T> {
    return s => {
        const v = s.get()
        const t = new Signal(fn(v) === true ? v : <any>undefined)
        s.subscribe(v => {
            if (fn(v) === true) {
                t.set(v)
            }
        })
        return t
    }
}
