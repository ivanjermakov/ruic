import { Component } from './comp'
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
    private unmounts: (() => void)[] = []

    constructor(
        private type: JsxElementType<P>,
        private props: P,
        private key?: any
    ) {
        const ps = <any>props
        if ('className' in ps) {
            ps.class = ps.className
        }
    }

    children(): any[] {
        const ps = <any>this.props
        if ('children' in ps) {
            if (Array.isArray(ps.children)) {
                return ps.children
            } else {
                return [ps.children]
            }
        }
        return []
    }

    /**
     * Remove element references and cancel subscriptions
     */
    drop(): void {
        this.unmounts.forEach(f => f())
        const ps = <JSX.HTMLAttributes>this.props
        ps.onUnmount?.()

        this.children().forEach(c => {
            this.dropChild(c)
        })
        for (const prop of Object.keys(ps)) {
            if (prop === 'children') continue
            const value = (<any>this.props)[prop]
            this.dropChild(value)
        }

        this.element = undefined
        this.componentElement = undefined
        this.keyMap.clear()
        this.subs.forEach(s => s())
    }

    render(root: Element): void {
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
            if (this.component instanceof Component) {
                this.componentElement = this.component.render()
                this.componentElement.render(this.root!)
            } else {
                this.element = this.root
                this.renderChild(this.component)
            }
        }
    }

    private renderChild(c: any, i?: number): void {
        if (typeof c === 'object' && c.hasOwnProperty('onUnmount')) {
            this.unmounts.push(c.onUnmount)
        }
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
            // element indices stay constant since jsx does not change
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
        const newKeyMap = new Map()
        let lastEl: Element | null = this.element!.firstElementChild
        newIdxMap.forEach((i, k) => {
            let e = keyMap.get(k)!
            const old = this.keyMap.get(k)
            const oi = oldIdxMap.get(k)
            if (old && oi !== undefined && oi === i) {
                // existing key at correct index, merge into old
                old.merge(e)
                lastEl = old.element!
                newKeyMap.set(k, old)
            } else {
                if (old && old.element) {
                    // existing key at wrong index, merge into old, move html elment
                    old.merge(e)
                    this.element!.insertBefore(old.element!, lastEl?.nextElementSibling ?? null)
                    lastEl = old.element!
                    newKeyMap.set(k, old)
                } else {
                    // non-existing key, create new
                    e.render(this.element!)
                    newKeyMap.set(k, e)
                }
            }
        })
        this.keyMap = newKeyMap
    }

    private renderNonKeyed(c: any[], keyMap: Map<any, JsxElement<any>>): void {
        const newKeysStr = new Set([...keyMap.keys()].map(k => k.toString()))
        for (let i = 0; i < this.element!.children.length - 1;) {
            const e = this.element!.children[i]
            // TODO: can't this.keyMap be used instead?
            const k = e.getAttribute('key')
            if (!k || !newKeysStr.has(k)) {
                // TODO: drop JsxElement holding this node
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
                    old.merge(e)
                    // make child last
                    this.element!.append(old.element)
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
        }
    }

    /**
     * Move required data so that this element is replacing other element and other element is dropped
     */
    private merge(other: JsxElement<any>): void {
        if (this === other) return
        other.drop()
    }
}
