import ReactivateAccount from '~/ui/billing/ReactivateAccount'

const mockApiSaveModel = jest.fn()
jest.mock('../../../app/javascript/utils/apiSaveModel', () => ({
  default: mockApiSaveModel,
}))

describe('ReactivateAccount', () => {
  const props = {
    apiStore: {
      currentUserOrganization: {
        deactivated: false,
        name: 'foo',
        primary_group: {
          filestack_file_url: 'foo://bar/baz',
        },
      },
    },
  }

  const render = () =>
    shallow(<ReactivateAccount.wrappedComponent {...props} />)

  describe('organization account not deactivated', () => {
    beforeEach(() => {
      props.apiStore.currentUserOrganization.deactivated = false
    })

    it('renders nothing', () => {
      expect(render().type()).toEqual(null)
    })
  })

  describe('organization account is deactivated', () => {
    beforeEach(() => {
      props.apiStore.currentUserOrganization.deactivated = true
    })

    it('renders a message about the account being closed', () => {
      expect(render().html()).toEqual(
        expect.stringContaining('This account is closed.')
      )
    })
  })
})
