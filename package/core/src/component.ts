import { JsxElement } from "./jsx-runtime";

export abstract class Component<P = {}> {
    constructor(public props: P) { }
    abstract render(): JsxElement
}
