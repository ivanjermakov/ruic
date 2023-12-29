import { id } from './operator/id'

export interface UnaryFunction<T, R> {
    (source: T): R
}

export type OperatorResult<T> = { type: 'value' | 'completed'; value: T } | { type: 'consumed' }

export interface OperatorFunction<T, R> extends UnaryFunction<T, OperatorResult<R>> {}

export type Subscription<T> = (value: T) => void

export type CancelSubscription = () => void

export class Signal<T> implements JSX.SignalLike<T> {
    private value: T
    private comparator?: (a: T, b: T) => boolean
    private observers: Set<Subscription<T>> = new Set()
    private cancelFeed?: CancelSubscription
    private cancelFed: Set<CancelSubscription> = new Set()
    private completed: boolean = false

    constructor(initial: T, comparator?: (a: T, b: T) => boolean) {
        this.value = initial
        this.comparator = comparator
    }

    get(): T {
        return this.value
    }

    set(value: T): void {
        if ((this.comparator ?? ((a, b) => a == b))(this.value, value)) return
        this.value = value
        this.observers.forEach(o => o(value))
    }

    update(fn: (value: T) => T): void {
        const v = fn(this.value)
        this.set(v)
    }

    complete(): void {
        this.observers.clear()
        this.cancelFed.forEach(f => f())
        this.cancelFed.clear()
        this.cancelFeed?.()
        this.value = <any>undefined
        this.completed = true
    }

    subscribe(fn: (value: T) => void): () => void {
        if (this.completed) return () => {}
        this.observers.add(fn)
        return () => this.observers.delete(fn)
    }

    feed<O>(other: Signal<O>, fn: OperatorFunction<T, O>): void {
        if (this.completed) {
            other.complete()
            return
        }
        const cancel = this.subscribe(v => {
            const r = fn(v)
            if (r.type === 'value') {
                other.set(<O>r.value)
            } else if (r.type === 'completed') {
                other.complete()
            }
        })
        const cancelFed = () => {
            cancel()
            this.cancelFed.delete(cancelFed)
        }
        this.cancelFed.add(cancelFed)
        other.cancelFeed = cancelFed
    }

    pipe<A>(op1: OperatorFunction<T, A>): Signal<A>
    pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): Signal<B>
    pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): Signal<C>
    pipe<A, B, C, D>(
        op1: OperatorFunction<T, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        ...operators: OperatorFunction<any, any>[]
    ): Signal<unknown>
    pipe<R>(...operators: OperatorFunction<any, any>[]): Signal<R> {
        const pipe = <T>(v: T): OperatorResult<R> => {
            let res = id()(v)
            for (const op of operators) {
                if (res.type === 'value') {
                    res = op(res.value)
                } else if (res.type === 'completed') {
                    return op(res)
                }
            }
            return <OperatorResult<R>>res
        }
        const initial = pipe(this.get())
        if (initial.type === 'completed') {
            const s = new Signal(initial.value)
            s.complete()
            return s
        }
        const s = new Signal<R>(initial.type === 'value' ? initial.value : <any>undefined)
        this.feed(s, pipe)
        return s
    }

    /**
     * Recursively extract signal's value
     */
    static unwrap(value: any): any {
        if (value instanceof Signal) {
            return Signal.unwrap(value.get())
        }
        return value
    }
}
