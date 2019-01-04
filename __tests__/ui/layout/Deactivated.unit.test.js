import Deactivated from '~/ui/layout/Deactivated'
import { Link } from 'react-router-dom'

describe('Deactivated', () => {
  const apiStore = {
    currentUserOrganization: {
      name: 'foo',
      primary_group: {},
    },
  }
  const render = () =>
    shallow(<Deactivated.wrappedComponent apiStore={apiStore} />)

  it('tells the user that the org account is closed', () => {
    const wrapper = render()
    expect(wrapper.html()).toEqual(
      expect.stringContaining('The foo account has been closed.')
    )
  })

  describe('user is an admin', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.primary_group.can_edit = true
    })

    it('links to the billing page', () => {
      const wrapper = render()
      const link = wrapper.find(Link)
      expect(link.props().to).toEqual('/billing')
      expect(link.props().children).toEqual('billing page')
    })
  })

  describe('user is not an admin', () => {
    beforeEach(() => {
      apiStore.currentUserOrganization.primary_group.can_edit = false
    })

    it('advises the user to contact their admin', () => {
      const wrapper = render()
      expect(wrapper.html()).toEqual(
        expect.stringContaining(
          'Contact your administrator to reopen the foo account.'
        )
      )
    })
  })
})
