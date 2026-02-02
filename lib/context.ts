import fs from 'fs'
import path from 'path'

/**
 * Load all Markdown files from the context folder for LLM prompt injection.
 * Runs on the server (API route); path is relative to project root.
 */
export async function loadContextBank(): Promise<string> {
  const contextDir = path.join(process.cwd(), 'context')
  if (!fs.existsSync(contextDir)) return ''

  const files = fs.readdirSync(contextDir).filter((f) => f.endsWith('.md'))
  const parts: string[] = []

  for (const file of files) {
    const filePath = path.join(contextDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    parts.push(`--- ${file}\n${content}`)
  }

  return parts.join('\n\n')
}
