import tachijs, {
  ConfigSetter,
  controller,
  httpPost,
  reqBody
} from '../../../index'
import request from 'supertest'
import bodyParser from 'body-parser'

describe('reqBody', () => {
  it('selects req.body', async () => {
    // Given
    const before: ConfigSetter = expressApp => {
      expressApp.use(bodyParser.json())
    }

    @controller('/')
    class HomeController {
      @httpPost('/')
      index(@reqBody() body: any) {
        return `Hello, ${body.name}`
      }
    }
    const app = tachijs({
      before,
      controllers: [HomeController]
    })

    // When
    const response = await request(app)
      .post('/')
      .send({
        name: 'test'
      })

    // Then
    expect(response).toMatchObject({
      status: 200,
      text: 'Hello, test'
    })
  })
})
