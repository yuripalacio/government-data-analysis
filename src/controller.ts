import type Service from './service'

interface ControllerProps {
  service: Service
}

export default class Controller {
  readonly service

  constructor ({ service }: ControllerProps) {
    this.service = service
  }

  static async initialize (args: { service: Service }) {
    const controller = new Controller(args)
    await controller._init()
  }

  async _init () {
    try {
      await this.service.runPipeline()
    } catch (error) {
      console.log({ error })
    }
  }
}
