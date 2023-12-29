import { OperatorResult, Signal } from "../signal"

export interface ForProps<T> {
    each: T[] | Signal<T[]>
    children: (t: T, i: number) => JSX.Element
    key?: (t: T, i: number) => any
}
export class For<T> extends Signal<JSX.Element[]> {

    private vs: T[]

    constructor(public props: ForProps<T>) {
        const vs = props.each instanceof Signal ? props.each.get() : props.each
        const fn = props.children
        const es = vs.map((v, i) => fn(v, i))
        super(es)
        this.vs = vs
        if (props.each instanceof Signal) {
            this.vs = props.each.get()
            props.each.feed(this, v => this.updateArray(this.vs, v))
        }
    }

    onUnmount(): void {
        this.complete()
    }

    private updateArray(old: T[], v: T[]): OperatorResult<JSX.Element[]> {
        return {
            type: 'value',
            value: v.map((e, i) => this.props.children(e, i))
        }
    }
}
