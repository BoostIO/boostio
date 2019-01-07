// tslint:disable:no-console
import 'reflect-metadata' // You have to import this to enable decorators.
import tachijs, {
  ConfigSetter,
  controller,
  httpGet,
  httpPost,
  reqParams,
  reqBody,
  inject,
  BaseController
} from 'tachijs'
import { IsString } from 'class-validator'
import bodyParser from 'body-parser'

enum ServiceTypes {
  EmailService = 'EmailService',
  NotificationService = 'NotificationService'
}

abstract class MailerService {
  abstract sendEmail(content: string): Promise<void>
}

class MockEmailService extends MailerService {
  async sendEmail(content: string) {
    console.log(`Not sending email.... content: ${content}`)
  }
}

class EmailService extends MailerService {
  async sendEmail(content: string) {
    console.log(`Sending email.... content: ${content}`)
  }
}

// Any classes can be injected other class.
class NotificationService {
  constructor(
    // When NotificationService instantiate, MailerService will also instantiate.
    @inject(ServiceTypes.EmailService) private mailer: MailerService
  ) {}

  async notifyMessage(content: string) {
    this.mailer.sendEmail(content)
  }
}

// Prepare class validator
class NotifyRequestBody {
  @IsString()
  message: string
}

@controller('/')
class HomeController extends BaseController {
  constructor(
    @inject(ServiceTypes.NotificationService)
    private notifier: NotificationService
  ) {
    super()
  }

  @httpGet('/')
  home() {
    return `<form action='/notify' method='post'><input type='text' name='message'><button>Notify</button></form>`
  }

  @httpGet('/posts/:id')
  async showId(@reqParams('id') id: string) {
    return {
      id
    }
  }

  @httpPost('/notify')
  // Apply class validator so we can be sure body is valid
  async notify(@reqBody() body: NotifyRequestBody) {
    await this.notifier.notifyMessage(body.message)

    return this.redirect('/')
  }
}

// All services should be registered to container for each service type
interface Container {
  [ServiceTypes.EmailService]: typeof MailerService
  [ServiceTypes.NotificationService]: typeof NotificationService
}

const envIsDev = process.env.NODE_ENV === 'development'

// You can easily switch any services depending on environment
const container: Container = envIsDev
  ? {
      // In development env, don't send real mail
      [ServiceTypes.EmailService]: MockEmailService,
      [ServiceTypes.NotificationService]: NotificationService
    }
  : {
      [ServiceTypes.EmailService]: EmailService,
      [ServiceTypes.NotificationService]: NotificationService
    }

const before: ConfigSetter = app => {
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  )
}

// Register controllers and container
const server = tachijs({
  before,
  controllers: [HomeController],
  container
})

console.log("Server listening at http://localhost:8000");

server.listen(8000)
