import ReactivateAccount from '~/ui/billing/ReactivateAccount'

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
  })
})
