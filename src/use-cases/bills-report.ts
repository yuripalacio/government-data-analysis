import csvParser from 'csv-parser'
import { createReadStream, createWriteStream } from 'fs'
import { dirname, resolve } from 'path'
import { pipeline } from 'stream'
import { fileURLToPath } from 'url'
import { promisify } from 'util'
import { Parser as JSON2CSV } from '@json2csv/plainjs'
import { config } from 'dotenv'

import { env } from '@/core/env'
import { billSchema, type BillProps, Bill } from '@/entities/bill'
import { voteResultSchema, type VoteResultProps, VoteResult } from '@/entities/vote-result'
import { Legislator, type LegislatorProps, legislatorSchema } from '@/entities/legislator'
import { Vote, voteSchema } from '@/entities/vote'

import { checkFilesExists } from '../utils/check-file-exists'

config()

const pipelineAsync = promisify(pipeline)
const JSON_2_CSV = new JSON2CSV({
  header: false
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const isBuildProject = !__dirname.includes('/src')

const BILLS_REPORT_NAME = env.BILLS_REPORT_NAME ?? 'bills'
const CSV_SEPARATOR = env.CSV_SEPARATOR ?? ','
const YEA_VOTE = env.YEA_VOTE ?? '1'
const NAY_VOTE = env.NAY_VOTE ?? '2'

export default class BillReportUseCase {
  private readonly billCSVFile: string
  private readonly billReportCSVFile: string
  private readonly voteResultsCSVFile: string
  private readonly voteCSVFile: string
  private readonly legislatorCSVFile: string
  private currentBill?: BillProps
  private currentBillReport?: string
  private currentVoteResult?: VoteResultProps
  private currentVoteForBill: boolean
  private currentBillPrimarySponsor?: string

  constructor () {
    this.billCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'input', 'bills.csv')
    this.billReportCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'output', `${BILLS_REPORT_NAME}.csv`)
    this.voteResultsCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'input', 'vote_results.csv')
    this.voteCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'input', 'votes.csv')
    this.legislatorCSVFile = resolve(__dirname, isBuildProject ? '' : '..', '..', 'input', 'legislators.csv')
    this.currentVoteForBill = false
  }

  async runPipeline (): Promise<void> {
    checkFilesExists([
      this.billCSVFile,
      this.voteResultsCSVFile,
      this.voteCSVFile,
      this.legislatorCSVFile
    ])

    await this.runProcessBill()
  }

  async runProcessBill (): Promise<void> {
    await pipelineAsync(
      createReadStream(this.billCSVFile),
      csvParser({
        separator: CSV_SEPARATOR
      }),
      this.transformInBill,
      this.processBills.bind(this),
      createWriteStream(this.billReportCSVFile)
    )
  }

  async * transformInBill (stream: any): AsyncGenerator<BillProps, void, unknown> {
    for await (const chunk of stream) {
      if (billSchema.safeParse(chunk).success) {
        const bill = Bill.create(billSchema.parse(chunk))

        yield bill
      }
    }
  }

  async * processBills (stream: any): AsyncGenerator<string | undefined, void, unknown> {
    for await (const chunk of stream) {
      const bill: BillProps = chunk

      this.currentBill = bill
      this.currentBillPrimarySponsor = 'Unknown'

      await pipelineAsync(
        createReadStream(this.legislatorCSVFile),
        csvParser({
          separator: CSV_SEPARATOR
        }),
        this.transformInLegislator,
        this.findPrimarySponsorName.bind(this)
      )

      await pipelineAsync(
        createReadStream(this.voteResultsCSVFile),
        csvParser({
          separator: CSV_SEPARATOR
        }),
        this.transformInVoteResult,
        this.calculateBill.bind(this)
      )

      yield this.currentBillReport
    }
  }

  async * transformInLegislator (stream: any): AsyncGenerator<LegislatorProps, void, unknown> {
    for await (const chunk of stream) {
      if (legislatorSchema.safeParse(chunk).success) {
        const legislator = Legislator.create(legislatorSchema.parse(chunk))

        yield legislator
      }
    }
  }

  async * findPrimarySponsorName (stream: any): AsyncGenerator<never, void, unknown> {
    for await (const chunk of stream) {
      const legislator: LegislatorProps = chunk

      if (this.currentBill?.sponsor_id === legislator.id) {
        this.currentBillPrimarySponsor = legislator.name
      }
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

  async * calculateBill (stream: any): AsyncGenerator<never, void, unknown> {
    const header = 'id,title,supporter_count,opposer_count,sponsor_id\n'
    const votes = {
      id: this.currentBill?.id,
      title: this.currentBill?.title,
      supporter_count: 0,
      opposer_count: 0,
      sponsor_id: this.currentBillPrimarySponsor
    }

    for await (const chunk of stream) {
      const voteResult: VoteResultProps = chunk

      this.currentVoteResult = voteResult
      this.currentVoteForBill = false
      await pipelineAsync(
        createReadStream(this.voteCSVFile),
        csvParser({
          separator: CSV_SEPARATOR
        }),
        this.findBillByVoteID.bind(this)
      )

      if (this.currentVoteForBill) {
        votes.supporter_count += voteResult.vote_type === YEA_VOTE ? 1 : 0
        votes.opposer_count += voteResult.vote_type === NAY_VOTE ? 1 : 0
      }
    }

    if (!this.currentBillReport) {
      this.currentBillReport = header
    } else {
      this.currentBillReport = ''
    }

    this.currentBillReport += JSON_2_CSV.parse(votes).replace(/"/g, '') + '\n'
  }

  async * findBillByVoteID (stream: any) {
    for await (const chunk of stream) {
      if (voteSchema.safeParse(chunk).success) {
        const vote = Vote.create(voteSchema.parse(chunk))

        if (
          !this.currentVoteForBill &&
          vote.id === this.currentVoteResult?.vote_id &&
          vote.bill_id === this.currentBill?.id
        ) {
          this.currentVoteForBill = true
        }
      }
    }
  }
}
