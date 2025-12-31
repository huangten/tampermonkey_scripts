import { createApp } from 'vue'
import App from './App.vue'
import elCss from 'element-plus/dist/index.css?raw'

function createShadowRoot() {
  const host = document.createElement('div')
  host.id = '__tm_ui_root__'
  document.body.appendChild(host)
  const style = document.createElement('style')
  style.textContent = elCss
  document.body.appendChild(style)
  return host
}

const mountEl = createShadowRoot()

const app = createApp(App)

app.mount(mountEl)
