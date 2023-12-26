import { Signal } from 'ruic'
import { Component } from 'ruic/component'
import { map } from 'ruic/operator'
import './styles.css'

export class App extends Component {
    count = new Signal(0)
    timestamps = new Signal<number[]>([])
    bigCount = this.count.pipe(map(c => c * 100))

    handleClick() {
        this.count.update(v => v + 1)
        this.timestamps.update(ts => [...ts, new Date().getTime()])
    }

    override render() {
        return (
            <div class="app">
                <h1 id="hello">Welcome to Ruic!</h1>
                <p>Big count: {this.bigCount}</p>
                <Button onClick={() => this.handleClick()}>
                    Click me! Clicks: {this.count.pipe(map(c => c.toString() + ' time' + (c === 1 ? '' : 's')))}
                </Button>
                <div class="timestamps">
                    {this.timestamps.pipe(map(ts => ts.map(t => <p key={t}>{new Date(t).toLocaleTimeString()}</p>)))}
                </div>
            </div>
        )
    }
}

type ButtonProps = Pick<JSX.HTMLAttributes, 'onClick' | 'children'>

export class Button extends Component<ButtonProps> {
    override render() {
        return (
            <button type="button" onClick={this.props.onClick}>
                {this.props.children}
            </button>
        )
    }
}
