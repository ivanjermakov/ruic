import { id } from './operator/id'

export interface UnaryFunction<T, R> {
    (source: T): R
}

export type OperatorResult<T> = { type: 'value'; value: T } | { type: 'completed' | 'consumed' }

export interface OperatorFunction<T, R> extends UnaryFunction<T, OperatorResult<R>> {}

export type Subscription<T> = (value: T) => void

export type CancelSubscription = () => void

export class Signal<T> implements JSX.SignalLike<T> {
    private value: T
    private comparator: (a: T, b: T) => boolean
    private observers: Map<number, Subscription<T>>
    private id: number = 0

    constructor(initial: T, comparator: (a: T, b: T) => boolean = (a, b) => a === b) {
        this.value = initial
        this.comparator = comparator
        this.observers = new Map()
    }

    get(): T {
        return this.value
    }

    set(value: T): void {
        if (this.comparator(this.value, value)) return
        this.value = value
        ;[...this.observers.values()].forEach(o => o(value))
    }

    update(fn: (value: T) => T): void {
        const v = fn(this.value)
        this.set(v)
    }

    complete(): void {
        this.observers.clear()
    }

    subscribe(fn: (value: T) => void): () => void {
        const id = ++this.id
        this.observers.set(id, fn)
        return () => this.observers.delete(id)
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
        const pipeFactory =
            () =>
            <T>(v: T): OperatorResult<R> => {
                let res = id()(v)
                for (const op of operators) {
                    if (res.type === 'value') {
                        res = op(res.value)
                    } else {
                        return res
                    }
                }
                return <OperatorResult<R>>res
            }
        const initial = pipeFactory()(this.get())
        const s = new Signal<R>(initial.type === 'value' ? initial.value : <any>undefined)
        const pipe = pipeFactory()
        this.subscribe(v => {
            const r = pipe(v)
            if (r.type === 'value') {
                s.set(<R>r.value)
            } else if (r.type === 'completed') {
                s.complete()
            }
        })
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
