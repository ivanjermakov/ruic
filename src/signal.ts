export interface UnaryFunction<T, R> {
    (source: T): R
}

export interface OperatorFunction<T, R> extends UnaryFunction<Signal<T>, Signal<R>> { }

export type Subscription<T> = (value: T) => void

export type CancelSubscription = () => void

export class Signal<T> implements JSX.SignalLike<T> {
    private value: T
    comparator: (a: T, b: T) => boolean
    observers: Map<number, Subscription<T>>
    id: number = 0

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
        ...operations: OperatorFunction<any, any>[]
    ): Signal<unknown>
    pipe(...operations: OperatorFunction<any, any>[]): Signal<unknown> {
        return operations.reduce((s, op) => op(s), <Signal<any>>this)
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

