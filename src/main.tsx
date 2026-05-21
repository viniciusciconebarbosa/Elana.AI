import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./globals.css"

import { Buffer } from "buffer"
if (typeof window !== "undefined") {
  ;(window as any).global = window
  ;(window as any).Buffer = Buffer
}

// Import local fonts
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"
import "@fontsource/roboto-mono/400.css"
import "@fontsource/roboto-mono/500.css"
import "@fontsource/roboto-mono/700.css"

// Import JetBrains Mono
import "@fontsource/jetbrains-mono/400.css"
import "@fontsource/jetbrains-mono/500.css"
import "@fontsource/jetbrains-mono/700.css"
import "@fontsource/jetbrains-mono/800.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
