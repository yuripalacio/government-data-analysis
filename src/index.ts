import { pipeline } from 'stream'
import { promisify } from 'util'
import { createReadStream } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const pipelineAsync = promisify(pipeline)
const __dirname = dirname(fileURLToPath(import.meta.url))

async function * transform (streams: any) {
  for await (const chunk of streams) {
    console.log('my chunk', chunk.toString())
  }
}

const run = async () => {
  const file = resolve(__dirname, '..', 'input', 'bills.csv')
  await pipelineAsync(
    createReadStream(file),
    transform
  )
}

void run()
