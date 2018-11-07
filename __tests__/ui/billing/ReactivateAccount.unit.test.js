import ReactivateAccount from '~/ui/billing/ReactivateAccount'

const mockApiSaveModel = jest.fn()
jest.mock('../../../app/javascript/utils/apiSaveModel', () => ({
  default: mockApiSaveModel,
}))

describe('ReactivateAccount', () => {
  const apiStore = {
    currentUser: {
      current_organization: {
        name: 'foo',
        primary_group: {},
      },
    },
  }
  let wrapper
  beforeEach(() => {
    wrapper = shallow(
      <ReactivateAccount.wrappedComponent apiStore={apiStore} />
    )
  })

  describe('organization account not deactivated', () => {
    beforeEach(() => {
      wrapper.setProps({
        apiStore: {
          currentUser: {
            current_organization: {
              name: 'foo',
              deactivated: false,
            },
          },
        },
      })
    })

    it('renders nothing', () => {
      expect(wrapper.type()).toEqual(null)
    })
  })

  describe('organization account is deactivated', () => {
    beforeEach(() => {
      wrapper.setProps({
        apiStore: {
          currentUser: {
            current_organization: {
              name: 'foo',
              deactivated: true,
            },
          },
        },
      })
    })

    it('renders a message about the account being closed', () => {
      expect(wrapper.html()).toEqual(
        expect.stringContaining('This account is closed.')
      )
    })

    // describe('reactivating account', () => {
    //   describe('success', () => {
    //     beforeEach(() => {
    //       mockApiSaveModel.mockImplementation(() => Promise.resolve())
    //     })

    //     it('shows a success alert', () => {
    //       wrapper.find('button').simulate('click')
    //       const alertDialog = wrapper.find('AlertDialog')
    //       expect(alertDialog.props().prompt).toEqual(
    //         'Your account has been reactivated!'
    //       )
    //     })
    //   })

    //   describe('failure', () => {
    //     it('tracks the error', () => {
    //       wrapper.find('button').simulate('click')
    //     })
    //   })
    // })
  })
})
