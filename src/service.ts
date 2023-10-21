import LegislatorsReportUseCase from './use-cases/legislators-report'
import BillReportUseCase from './use-cases/bills-report'

export default class Service {
  readonly legislatorsReportUseCase
  readonly billReportUseCase

  constructor () {
    this.legislatorsReportUseCase = new LegislatorsReportUseCase()
    this.billReportUseCase = new BillReportUseCase()
  }

  async runPipeline () {
    return [
      this.legislatorsReportUseCase.runPipeline(),
      this.billReportUseCase.runPipeline()
    ]
  }
}
