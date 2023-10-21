import csvParser from 'csv-parser'
import { createReadStream, createWriteStream } from 'fs'
import { dirname, resolve } from 'path'
import { pipeline } from 'node:stream'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { Parser as JSON2CSV } from '@json2csv/plainjs'
import { config } from 'dotenv'

import { env } from '@/core/env'
import { legislatorSchema, type LegislatorProps, Legislator } from '@/entities/legislator'
import { VoteResult, type VoteResultProps, voteResultSchema } from '@/entities/vote-result'

import { checkFilesExists } from '../utils/check-file-exists'

config()

const pipelineAsync = promisify(pipeline)
const JSON_2_CSV = new JSON2CSV({
  header: false
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const isBuildProject = !__dirname.includes('/src')

const LEGISLATORS_REPORT_NAME = env.LEGISLATORS_REPORT_NAME
const CSV_SEPARATOR = env.CSV_SEPARATOR
const YEA_VOTE = env.YEA_VOTE
const NAY_VOTE = env.NAY_VOTE

export default class LegislatorsReportUseCase {
  private readonly legislatorCSVFile: string
  private readonly legislatorsSupportCSVFile: string
  private readonly voteResultsCSVFile: string
  private currentLegislator?: LegislatorProps
  private currentLegislatorSupport?: string

  constructor () {
    this.legislatorCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'input', 'legislators.csv')
    this.legislatorsSupportCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'output', `${LEGISLATORS_REPORT_NAME}.csv`)
    this.voteResultsCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'input', 'vote_results.csv')
  }

  async runPipeline (): Promise<void> {
    checkFilesExists([
      this.legislatorCSVFile,
      this.voteResultsCSVFile
    ])

    await this.runProcessLegislator()
  }

  async runProcessLegislator (): Promise<void> {
    await pipelineAsync(
      createReadStream(this.legislatorCSVFile),
      csvParser({
        separator: CSV_SEPARATOR
      }),
      this.transformInLegislator,
      this.processLegislators.bind(this),
      createWriteStream(this.legislatorsSupportCSVFile)
    )
  }

  async * transformInLegislator (stream: any): AsyncGenerator<LegislatorProps, void, unknown> {
    for await (const chunk of stream) {
      if (legislatorSchema.safeParse(chunk).success) {
        const legislator = Legislator.create(legislatorSchema.parse(chunk))

        yield legislator
      }
    }
  }

  async * processLegislators (stream: any): AsyncGenerator<string | undefined, void, unknown> {
    for await (const chunk of stream) {
      const legislator: LegislatorProps = chunk

      this.currentLegislator = legislator
      await pipelineAsync(
        createReadStream(this.voteResultsCSVFile),
        csvParser({
          separator: CSV_SEPARATOR
        }),
        this.transformInVoteResult,
        this.calculateLegislatorsSupportOppose.bind(this)
      )

      yield this.currentLegislatorSupport
    }
  }

  async * transformInVoteResult (stream: any): AsyncGenerator<VoteResultProps, void, unknown> {
    for await (const chunk of stream) {
      if (voteResultSchema.safeParse(chunk).success) {
        const voteResult = VoteResult.create(voteResultSchema.parse(chunk))

        yield voteResult
      }
    }
  }

  async * calculateLegislatorsSupportOppose (stream: any): AsyncGenerator<never, void, unknown> {
    const header = 'id,name,num_supported_bills,num_opposed_bills\n'
    const votes = {
      id: this.currentLegislator?.id,
      name: this.currentLegislator?.name,
      num_supported_bills: 0,
      num_opposed_bills: 0
    }

    for await (const chunk of stream) {
      const voteResult: VoteResultProps = chunk

      if (voteResult.legislator_id === this.currentLegislator?.id) {
        votes.num_supported_bills += voteResult.vote_type === YEA_VOTE ? 1 : 0
        votes.num_opposed_bills += voteResult.vote_type === NAY_VOTE ? 1 : 0
      }
    }

    if (!this.currentLegislatorSupport) {
      this.currentLegislatorSupport = header
    } else {
      this.currentLegislatorSupport = ''
    }

    this.currentLegislatorSupport += JSON_2_CSV.parse(votes).replace(/"/g, '') + '\n'
  }
}
