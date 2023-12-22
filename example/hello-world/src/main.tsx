import { render } from 'ruic'
import { App } from './app.tsx'

const app = <App />
render(app, document.getElementById('app')!)
