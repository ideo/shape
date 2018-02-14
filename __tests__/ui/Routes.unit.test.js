import Routes from '~/ui/Routes'
import apiStoreMock from '#/mocks/apiStoreMock'

let props, requestResult, apiStore, history
beforeEach(() => {
  requestResult = { data: { id: 1 } }
  history = {}
  apiStore = apiStoreMock({
    requestResult
  })
  props = { apiStore, history }
  shallow(
    <Routes.wrappedComponent {...props} />
  )
})

describe('Routes', () => {
  it('makes an API call to fetch the user', () => {
    expect(apiStore.request).toBeCalledWith('users/me')
    expect(apiStore.sync).toBeCalledWith(requestResult)
    expect(apiStore.setCurrentUserId).toBeCalledWith(requestResult.data.id)
  })
})
