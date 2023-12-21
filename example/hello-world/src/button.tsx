import { Component } from '@yaul/core/component'

export class Button extends Component<JSX.HTMLAttributes> {
    override render() {
        return <button type="button">{this.props.children}</button>
    }
}
