import Service from './service.js'
import Controller from './controller.js'

const service = new Service()

void Controller.initialize({
  service
})
