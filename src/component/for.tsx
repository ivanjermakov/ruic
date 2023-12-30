import { OperatorResult, Signal } from "../signal"

export interface ForProps<T> {
    each: T[] | Signal<T[]>
    children: (t: T, i: number) => JSX.Element
    key?: (t: T, i: number) => any
}
export class For<T> extends Signal<JSX.Element[]> {

    private vs: Map<T, number>
    private es: JSX.Element[]

    constructor(public props: ForProps<T>) {
        const vs = props.each instanceof Signal ? props.each.get() : props.each
        const fn = props.children
        const es = vs.map((v, i) => fn(v, i))
        super(es)
        this.vs = toMap(vs)
        this.es = es
        if (props.each instanceof Signal) {
            this.vs = toMap(props.each.get())
            props.each.feed(this, vs => this.updateArray(vs))
        }
    }

    onUnmount(): void {
        this.complete()
    }

    private updateArray(vs: T[]): OperatorResult<JSX.Element[]> {
        this.es = vs.map((e, i) => {
            const idx = this.vs.get(e)
            if (idx !== undefined) {
                return this.es[idx]
            }
            return this.props.children(e, i)
        })
        this.vs = toMap(vs)
        return {
            type: 'value',
            value: this.es
        }
    }

}

function toMap<T>(vs: T[]): Map<T, number> {
    return new Map(vs.map((v, i) => [v, i]))
}

