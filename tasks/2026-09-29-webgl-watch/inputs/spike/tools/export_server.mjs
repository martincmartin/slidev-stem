// The server that `slidev export` starts: Slidev in "export" mode, which
// turns on the /print route. deck_check.py runs the export's browser steps
// against it, since `slidev export` itself needs playwright-chromium.
//
//     pnpm exec node <this file> <slides.md> <port>     # in watches/
import { createServer, resolveOptions } from '@slidev/cli'

const [entry, port] = process.argv.slice(2)
const options = await resolveOptions({ entry }, 'export')
const server = await createServer(options, { server: { port: Number(port) }, clearScreen: false })
await server.listen(Number(port))
console.log(`export server on ${port}`)
