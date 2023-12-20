import { JSX } from "./jsx-internal";

export abstract class Component<P = {}> {
    constructor(public props: P) { }
    abstract render(): JSX.Element
}
