export class Signal<T> implements JSX.SignalLike<T> {

    private value: T;
    comparator: (a: T, b: T) => boolean
    observers: ((value: T) => void)[]

    constructor(initial: T, comparator: (a: T, b: T) => boolean = (a, b) => a === b) {
        this.value = initial
        this.comparator = comparator
        this.observers = []
    }

    get(): T {
        return this.value
    }

    set(value: T): void {
        if (this.comparator(this.value, value)) return
        this.value = value
        this.observers.forEach(o => o(value))
    }

    update(fn: (value: T) => T): void {
        this.set(fn(this.value))
    }

    subscribe(fn: (value: T) => void): void {
        this.observers.push(fn)
    }

}

