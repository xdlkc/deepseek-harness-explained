import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  Session,
  SessionId,
  type SessionEvent,
  type SessionHeader,
} from '../../deepseek-harness/packages/core/session/src/index.ts'

const DEFAULT_FIXTURE = new URL(
  '../../deepseek-harness/examples/headless-agent/tests/snapshots/headless-profile/session.expected.jsonl',
  import.meta.url,
)

type PackedRow = SessionHeader | SessionEvent

function replaceFixtureTokens(value: unknown): unknown {
  if (value === '{{sessionId}}') return 'replay-demo'
  if (value === '{{cwd}}') return '/tmp/deepseek-harness-replay-demo'
  if (value === '{{system}}') return '[fixture system prompt omitted]'
  if (value === '{{tools}}') return []
  if (Array.isArray(value)) return value.map(replaceFixtureTokens)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, replaceFixtureTokens(child)]),
    )
  }
  return value
}

async function loadPackedRows(path: string): Promise<PackedRow[]> {
  const text = await readFile(path, 'utf8')
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => replaceFixtureTokens(JSON.parse(line)) as PackedRow)
}

function previewMessage(message: ReturnType<Session['deriveMessages']>[number]): string {
  const content = message.content
    .map((part) => {
      if (part.type === 'text') return part.text
      if (part.type === 'tool-call') return `tool-call ${part.name}(${part.arguments})`
      if (part.type === 'tool-result') {
        const text = part.content
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join(' ')
        return `tool-result ${part.toolCallId}: ${text}`
      }
      return part.type
    })
    .join(' ')
  return content.length > 120 ? `${content.slice(0, 117)}...` : content
}

function describeRequest(events: SessionEvent[], requestEvent: SessionEvent): void {
  const prefix = events.slice(0, requestEvent.seq + 1)
  const replayed = Session.create(SessionId(`request-${requestEvent.seq}`), prefix)
  const header = replayed.requestHeader()
  const messages = replayed.deriveMessages()

  console.log(`\nREQUEST @ seq ${requestEvent.seq}`)
  console.log(`  reason: ${requestEvent.type === 'request/header' ? requestEvent.data.reason : 'unknown'}`)
  console.log(`  route:  ${header?.config.provider}/${header?.config.model}`)
  console.log(`  system: ${header?.system?.length ?? 0} chars`)
  console.log(`  tools:  ${header?.tools?.length ?? 0}`)
  console.log(`  history reconstructed from ${prefix.length} durable events:`)
  messages.forEach((message, index) => {
    console.log(`    ${index + 1}. ${message.role.padEnd(9)} ${previewMessage(message)}`)
  })
}

async function main(): Promise<void> {
  const fixturePath = process.argv[2]
    ? fileURLToPath(new URL(process.argv[2], `file://${process.cwd()}/`))
    : fileURLToPath(DEFAULT_FIXTURE)
  const rows = await loadPackedRows(fixturePath)
  const [header, ...events] = rows

  if (!header || header.type !== 'session') throw new Error('first JSONL row is not a session header')
  const sessionHeader = header as SessionHeader
  const sessionEvents = events as SessionEvent[]
  const replayed = Session.create(SessionId(sessionHeader.id), sessionEvents, sessionHeader)
  const requestEvents = sessionEvents.filter((event) => event.type === 'request/header')

  console.log('DeepSeek Harness session replay')
  console.log(`fixture: ${fixturePath}`)
  console.log(`events:  ${sessionEvents.length}`)
  console.log(`surface: ${replayed.surface.nodes.length} model-visible nodes`)
  console.log(`requests: ${requestEvents.length}`)

  requestEvents.forEach((event) => describeRequest(sessionEvents, event))

  console.log('\nFINAL TRANSCRIPT')
  replayed.deriveMessages().forEach((message, index) => {
    console.log(`  ${index + 1}. ${message.role.padEnd(9)} ${previewMessage(message)}`)
  })
  console.log('\nThe replay used Session.create(), requestHeader(), and deriveMessages() from the pinned source tree.')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
