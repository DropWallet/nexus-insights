import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS v4 Configuration
 * Theme is defined via @theme in app/globals.css (Nexus DS from NexusBoilerplate).
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}

export default config
