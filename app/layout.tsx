import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Manrope } from "next/font/google"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "AeroPhysics Simulator - Interactive Flight Physics Education",
  description:
    "Learn aerodynamics and flight physics through interactive simulations. Explore Bernoulli's principle, lift, drag, and more with real aircraft data.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <head>
        <style>{`
html {
  font-family: ${geist.style.fontFamily};
  --font-sans: var(--font-geist);
  --font-serif: var(--font-manrope);
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
