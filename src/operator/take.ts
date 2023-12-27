import { OperatorFunction, Signal } from '../signal'

export function take<T>(n: number): OperatorFunction<T, T> {
    return s => {
        let i = 0
        const t = new Signal(s.get())
        s.subscribe(v => {
            i++
            t.set(v)
            if (i >= n) {
                t.complete()
            }
        })
        return t
    }
}
