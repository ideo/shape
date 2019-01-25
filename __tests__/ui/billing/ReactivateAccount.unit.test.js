import ReactivateAccount from '~/ui/billing/ReactivateAccount'

let wrapper
describe('ReactivateAccount', () => {
  const props = {
    apiStore: {
      currentUserOrganization: {
        patch: jest.fn(),
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
      wrapper = render()
    })

    it('renders a message about the account being closed', () => {
      expect(wrapper.html()).toEqual(
        expect.stringContaining('This account is closed.')
      )
    })

    describe('reactivate', () => {
      it('calls organization.patch() with deactivated = false', () => {
        const component = wrapper.instance()
        component.reactivate()
        expect(props.apiStore.currentUserOrganization.deactivated).toEqual(
          false
        )
        expect(props.apiStore.currentUserOrganization.patch).toHaveBeenCalled()
      })
    })
  })
})
