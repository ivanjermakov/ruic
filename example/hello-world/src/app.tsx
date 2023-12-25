import { Signal } from 'ruic'
import { Component } from 'ruic/component'
import { map } from 'ruic/operator'
import './styles.css'

export class App extends Component {

    count = new Signal(0)
    bigCount = this.count.pipe(map(c => c * 100))

    handleClick() {
        this.count.update(v => v + 1)
    }

    override render() {
        return <div className="app">
            <h1 id="hello">Welcome to Ruic!</h1>
            <p>Big count: {this.bigCount}</p>
            <Button onClick={() => this.handleClick()}>
                Click me! Clicks: {this.count.pipe(map(c => c.toString() + ' time' + (c === 1 ? '' : 's')))}
            </Button>
        </div>
    }

}

type ButtonProps = Pick<JSX.HTMLAttributes, 'onClick' | 'children'>

export class Button extends Component<ButtonProps> {

    override render() {
        return <button type="button" onClick={this.props.onClick}>{this.props.children}</button>
    }

}
