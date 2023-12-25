export interface UnaryFunction<T, R> {
    (source: T): R;
}

export interface OperatorFunction<T, R> extends UnaryFunction<Signal<T>, Signal<R>> { }

export class Signal<T> implements JSX.SignalLike<T> {

    private value: T;
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
        this.value = value;
        [...this.observers.values()].forEach(o => o.fn(value, o))
    }

    update(fn: (value: T) => T): void {
        const v = fn(this.value)
        this.set(v)
    }

    subscribe(fn: (value: T, subscription: Subscription<T>) => void): Subscription<T> {
        const id = ++this.id;
        const sub = new Subscription<T>(id, fn, this.observers)
        this.observers.set(id, sub)
        return sub
    }

    once(fn: (value: T) => void): void {
        this.subscribe((v, sub) => {
            sub.cancel()
            fn(v)
        })
    }

    pipe<A>(op1: OperatorFunction<T, A>): Signal<A>;
    pipe<A, B>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>): Signal<B>;
    pipe<A, B, C>(op1: OperatorFunction<T, A>, op2: OperatorFunction<A, B>, op3: OperatorFunction<B, C>): Signal<C>;
    pipe<A, B, C, D>(
        op1: OperatorFunction<T, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        ...operations: OperatorFunction<any, any>[]
    ): Signal<unknown>;
    pipe(...operations: OperatorFunction<any, any>[]): Signal<unknown> {
        return operations.reduce((s, op) => op(s), <Signal<any>>this)
    }

}

export class Subscription<T> {
    constructor(
        public id: number,
        public fn: (value: T, subscription: Subscription<T>) => void,
        private observers: Map<number, Subscription<T>>
    ) { }

    cancel(): boolean {
        const deleted = this.observers.delete(this.id)
        if (!deleted) {
            console.debug(`subscription @${this.id} does not exist`)
        }
        return deleted
    }
}
