import { Component } from './component'
import { Signal } from './signal'

export type JsxComponentType<P> = new (props: P) => Component<P>

export type JsxElementType<P> = string | JsxComponentType<P>

export class JsxElement<P> {
    root?: HTMLElement
    element?: HTMLElement
    component?: Component<P>
    componentElement?: JsxElement<any>
    keyMap: Map<any, JsxElement<any>> = new Map()

    constructor(
        public type: JsxElementType<P>,
        public props: P,
        public key?: any
    ) {
        const ps = <any>props
        if ('children' in ps && !Array.isArray(ps.children)) {
            ps.children = [ps.children]
        }
        if ('className' in ps) {
            ps.class = ps.className
        }
    }

    children(): JSX.Element[] {
        const ps = <any>this.props
        return 'children' in ps ? <JsxElement<any>[]>ps.children : []
    }

    render(root: HTMLElement): void {
        this.root = root
        if (typeof this.type === 'string') {
            this.renderIntrinsic()
        } else {
            this.renderComponent()
        }
    }

    private renderIntrinsic(): void {
        if (!this.element) {
            this.element = document.createElement(<string>this.type)
        }

        const children = this.children()
        if (children) {
            for (const c of children) {
                this.renderChild(c)
            }
        }

        for (const prop of Object.keys(<any>this.props)) {
            if (prop === 'children') continue
            const value = (<any>this.props)[prop]
            if (prop.startsWith('on')) {
                this.element.addEventListener(prop.slice(2).toLowerCase(), <EventListenerOrEventListenerObject>value)
            } else {
                this.setAttribute(prop, value)
            }
        }

        this.root!.appendChild(this.element)
    }

    private renderComponent(): void {
        if (typeof this.type === 'string') {
            console.warn('not a component', this)
            return
        }
        if (!this.component || !this.componentElement) {
            this.component = new this.type(this.props)
            this.componentElement = this.component.render()
        }
        this.componentElement.render(this.root!)
    }

    private renderChild(c: any): void {
        if (Array.isArray(c)) {
            if (c.length === 0 || (c[0] instanceof JsxElement && c[0].key !== undefined)) {
                const es = c
                    .filter(e => e instanceof JsxElement)
                    .map(e => <JsxElement<any>>e)
                    .filter(e => e.key !== undefined)
                if (es.length === c.length) {
                    {
                        // do some smart things instead of this
                        this.deleteChildren()
                        c.forEach(sc => this.renderChild(sc))
                    }
                    this.keyMap.clear()
                    es.forEach(e => this.keyMap.set(e.key!, e))
                }
            } else {
                this.keyMap.clear()
                this.deleteChildren()
                c.forEach(sc => this.renderChild(sc))
            }
        } else if (c instanceof Signal) {
            this.renderChild(c.get())
            c.subscribe(c_ => this.renderChild(c_))
        } else if (typeof c === 'string' || typeof c === 'number') {
            const t = document.createTextNode(c.toString())
            this.element!.appendChild(t)
        } else if (c instanceof JsxElement) {
            c.render(this.element!)
        } else {
            console.warn('unexpected child', c)
        }
    }

    private setAttribute(prop: string, value: any): void {
        let v = value
        if (value instanceof Signal) {
            v = Signal.unwrap(value)
            value.subscribe(v => this.setAttribute(prop, v))
        }
        this.element!.setAttribute(prop, v)
    }

    private deleteChildren(): void {
        while (this.element?.firstChild) {
            this.element.removeChild(this.element.firstChild)
        }
    }
}
