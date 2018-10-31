import OverdueBanner from '~/ui/layout/OverdueBanner'

const apiStore = {
  currentUser: {
    current_organization: {
      name: 'foo',
      inaccessible_at: 'bar',
      primary_group: {},
    },
  },
}

function render() {
  return shallow(<OverdueBanner.wrappedComponent apiStore={apiStore} />)
}

describe('OverdueBanner', () => {
  describe('current organization overdue, in_app_billing disabled', () => {
    beforeEach(() => {
      apiStore.currentUser.current_organization.overdue = true
      apiStore.currentUser.current_organization.in_app_billing = false
    })

    it('should render nothing', () => {
      expect(render().type()).toEqual(null)
    })
  })

  describe('current organization not overdue, in_app_billing disabled', () => {
    beforeEach(() => {
      apiStore.currentUser.current_organization.overdue = false
      apiStore.currentUser.current_organization.in_app_billing = false
    })

    it('should render nothing', () => {
      expect(render().type()).toEqual(null)
    })
  })

  describe('current organization not overdue, in_app_billing enabled', () => {
    beforeEach(() => {
      apiStore.currentUser.current_organization.overdue = false
      apiStore.currentUser.current_organization.in_app_billing = true
    })

    it('should render nothing', () => {
      expect(render().type()).toEqual(null)
    })
  })

  describe('current organization overdue, in_app_billing enabled', () => {
    beforeEach(() => {
      apiStore.currentUser.current_organization.overdue = true
      apiStore.currentUser.current_organization.in_app_billing = true
    })

    it('should render an overdue message', () => {
      const wrapper = render()
      expect(wrapper.html()).toMatch(
        `${
          apiStore.currentUser.current_organization.name
        } account is overdue. Your content will become inaccessible on ${
          apiStore.currentUser.current_organization.inaccessible_at
        }.`
      )
    })

    describe('current user is org admin', () => {
      beforeEach(() => {
        apiStore.currentUser.current_organization.primary_group.can_edit = true
      })

      it('should render a link to billing with a message', () => {
        const wrapper = render()
        const link = wrapper.find('Link')
        expect(link.props().to).toEqual('/billing')
        expect(link.children().text()).toEqual('here.')
      })
    })

    describe('current user is not org admin', () => {
      beforeEach(() => {
        apiStore.currentUser.current_organization.primary_group.can_edit = false
      })

      it('should render a link to billing with a message', () => {
        const wrapper = render()
        expect(wrapper.find('Link').length).toEqual(0)
        expect(wrapper.html()).toMatch('Contact your admin for assistance.')
      })
    })
  })
})
