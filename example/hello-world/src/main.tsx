import { render } from '@yaul/core'
import { App } from './app.tsx'

const app = <App />
render(app, document.getElementById('app')!)
