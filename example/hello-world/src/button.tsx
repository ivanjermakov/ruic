import { Component } from '@yaul/core/component'

export class Button extends Component<JSX.HTMLAttributes> {
    override render() {
        return <button type="button" onClick={this.props.onClick}>{this.props.children}</button>
    }
}
