import { Component } from './component'
import { first } from './operator'
import { CancelSubscription, Signal } from './signal'

export type JsxComponentType<P> = new (props: P) => Component<P>

export type JsxElementType<P> = string | JsxComponentType<P>

export class JsxElement<P> {
    private root?: Element
    private element?: Element
    private component?: Component<P>
    private componentElement?: JsxElement<any>
    private keyMap: Map<any, JsxElement<any>> = new Map()
    private subs: CancelSubscription[] = []

    constructor(
        private type: JsxElementType<P>,
        private props: P,
        private key?: any
    ) {
        const ps = <any>props
        if ('children' in ps && !Array.isArray(ps.children)) {
            ps.children = [ps.children]
        }
        if ('className' in ps) {
            ps.class = ps.className
        }
    }

    children(): any[] {
        const ps = <any>this.props
        return 'children' in ps ? ps.children : []
    }

    render(root: Element): void {
        this.root = root
        if (typeof this.type === 'string') {
            this.renderIntrinsic()
        } else {
            this.renderComponent()
        }
    }

    /**
     * Remove element references and cancel subscriptions
     */
    drop(): void {
        this.children().forEach(c => {
            this.dropChild(c)
        })
        this.element = undefined
        this.componentElement = undefined
        this.keyMap.clear()
        this.subs.forEach(fn => fn())
    }

    private renderIntrinsic(): void {
        if (!this.element) {
            this.element = document.createElement(<string>this.type)
        }

        const children = this.children()
        if (children) {
            for (let i = 0; i < children.length; i++) {
                const c = children[i]
                this.renderChild(c, i)
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

        if (this.key !== undefined) {
            this.setAttribute('key', this.key)
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

    private renderChild(c: any, i?: number): void {
        if (Array.isArray(c)) {
            const keyMap = new Map(
                c
                    .filter(e => e instanceof JsxElement)
                    .map(e => <JsxElement<any>>e)
                    .filter(e => e.key !== undefined)
                    .map(e => <const>[e.key, e])
            )
            if (this.keyMap.size === this.element!.children.length) {
                // fast path: delete all children
                if (keyMap.size === 0) {
                    this.keyMap.forEach(v => v.drop())
                    this.keyMap.clear()
                    this.element!.replaceChildren()
                } else {
                    this.renderKeyed(keyMap)
                }
            } else {
                this.renderNonKeyed(c, keyMap)
            }
        } else if (c instanceof Signal) {
            this.renderChild(c.get(), i)
            this.subs.push(c.subscribe(c_ => this.renderChild(c_, i)))
        } else if (typeof c === 'string' || typeof c === 'number') {
            // element indices stay be constant since jsx won't change
            const e = i !== undefined ? this.childAt(i) : undefined
            if (e) {
                if (e && e instanceof Text) {
                    e.nodeValue = c.toString()
                } else {
                    console.warn('expected text node, got', e)
                }
            } else {
                const t = document.createTextNode(c.toString())
                this.element!.appendChild(t)
            }
        } else if (c instanceof JsxElement) {
            c.render(this.element!)
        } else {
            console.warn('unexpected child', c)
        }
    }

    private renderKeyed(keyMap: Map<any, JsxElement<any>>): void {
        this.keyMap.forEach((v, k) => {
            if (!keyMap.has(k)) {
                v.element?.remove()
                v.drop()
                this.keyMap.delete(k)
            }
        })
        const oldIdxMap = new Map([...this.keyMap.keys()].map((k, i) => [k, i]))
        const newIdxMap = new Map([...keyMap.keys()].map((k, i) => [k, i]))
        let lastEl: Element | null = this.element!.firstElementChild
        newIdxMap.forEach((i, k) => {
            let e = keyMap.get(k)!
            const old = this.keyMap.get(k)
            const oi = oldIdxMap.get(k)
            if (old && oi !== undefined && oi === i) {
                e.element = old.element
                lastEl = old!.element!
            } else {
                if (old && old.element) {
                    e.element = old.element
                    this.element!.insertBefore(e.element!, lastEl?.nextElementSibling ?? null)
                    lastEl = e.element!
                } else {
                    e.render(this.element!)
                }
            }
        })
        this.keyMap.clear()
        keyMap.forEach((v, k) => this.keyMap.set(k, v))
    }

    private renderNonKeyed(c: any[], keyMap: Map<any, JsxElement<any>>): void {
        const newKeysStr = new Set([...keyMap.keys()].map(k => k.toString()))
        for (let i = 0; i < this.element!.children.length - 1; ) {
            const e = this.element!.children[i]
            const k = e.getAttribute('key')
            if (!k || !newKeysStr.has(k)) {
                // TODO drop JsxElement holding this node
                e.remove()
            } else {
                i++
            }
        }
        for (let i = 0; i < c.length; i++) {
            const e = c[i]
            if (e instanceof JsxElement && e.key !== undefined) {
                const old = this.keyMap.get(e.key)
                if (old && old.element) {
                    e.element = old.element
                    // make child last
                    this.element!.append(e.element)
                } else {
                    e.render(this.element!)
                }
                this.keyMap.set(e.key, e)
            } else {
                this.renderChild(e, i)
            }
        }
    }

    private setAttribute(prop: string, value: any): void {
        let v = value
        if (value instanceof Signal) {
            v = Signal.unwrap(value)
            this.subs.push(value.subscribe(v => this.setAttribute(prop, v)))
        }
        this.element!.setAttribute(prop, v)
    }

    private childAt(index: number): Node | undefined {
        if (index >= this.element!.childNodes.length) return undefined
        let n = this.element!.firstChild ?? undefined
        for (let i = 0; i < index; i++) {
            if (!n) return undefined
            n = n.nextSibling ?? undefined
        }
        return n
    }

    private dropChild(c: any): void {
        if (c instanceof JsxElement) {
            c.drop()
        } else if (Array.isArray(c)) {
            c.forEach(cc => this.dropChild(cc))
        } else if (c instanceof Signal) {
            c.complete()
        }
    }
}
