import UserDropdown from '~/ui/layout/UserDropdown'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { CONTEXT_USER, CONTEXT_COMBO } from '~/ui/global/MainMenuDropdown'

describe('UserDropdown', () => {
  let apiStore, props, wrapper

  const render = () => {
    wrapper = shallow(<UserDropdown.wrappedComponent {...props} />)
  }

  beforeEach(() => {
    wrapper = undefined
    apiStore = fakeApiStore()
    props = {
      apiStore,
      routingStore: fakeRoutingStore,
      uiStore: { ...fakeUiStore },
    }
  })

  describe('menuContext', () => {
    it(`is "${CONTEXT_USER}" for non-mobile viewports`, () => {
      props.routingStore.isAdmin = false
      props.uiStore.isMobile = false

      render()

      expect(wrapper.instance().menuContext).toEqual(CONTEXT_USER)
    })

    it(`is "${CONTEXT_COMBO}" for mobile viewport`, () => {
      props.routingStore.isAdmin = false
      props.uiStore.isMobile = true

      render()

      expect(wrapper.instance().menuContext).toEqual(CONTEXT_COMBO)
    })

    it(`is "${CONTEXT_USER}" in the admin for non-mobie viewports`, () => {
      props.routingStore.isAdmin = true
      props.uiStore.isMobile = false

      render()

      expect(wrapper.instance().menuContext).toEqual(CONTEXT_USER)
    })

    it(`is "${CONTEXT_USER}" in the admin for mobie viewports`, () => {
      props.routingStore.isAdmin = true
      props.uiStore.isMobile = true

      render()

      expect(wrapper.instance().menuContext).toEqual(CONTEXT_USER)
    })
  })
})
