import Routes from '~/ui/Routes'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeUser
} from '#/mocks/data'

jest.mock('firebase/auth')
jest.mock('firebase/app', () => (
  {
    firestore: jest.fn().mockReturnValue({ settings: jest.fn() }),
    initializeApp: jest.fn(),
    auth: jest.fn()
      .mockReturnValue({
        signInWithCustomToken: jest.fn(),
        onAuthStateChanged: jest.fn(),
      }),
  }
))

let props, wrapper, requestResult, apiStore, uiStore, routingStore
beforeEach(() => {
  requestResult = { data: fakeUser }
  routingStore = {}
  apiStore = fakeApiStore({
    requestResult
  })
  uiStore = fakeUiStore
  props = { apiStore, uiStore, routingStore }
})

describe('Routes', () => {
  describe('with terms accepted', () => {
    beforeEach(() => {
      props.apiStore.currentUser.terms_accepted = true
      props.isAnonymous = false
      props.routingStore.pathContains = jest.fn().mockReturnValue(false)
      wrapper = shallow(
        <Routes.wrappedComponent {...props} />
      )
    })

    it('makes an API call to fetch the user', () => {
      expect(apiStore.loadCurrentUserAndGroups).toHaveBeenCalled()
    })

    it('does not blur the content if terms have been accepted', () => {
      expect(wrapper.find('AppWrapper').props().blur).toBeFalsy()
    })

    it('does not display the TermsOfUseModal', () => {
      expect(wrapper.find('TermsOfUseModal').exists()).toBeFalsy()
    })
  })

  describe('with terms not yet accepted', () => {
    beforeEach(() => {
      requestResult = { data: { ...fakeUser, terms_accepted: false } }
      props.apiStore.request = jest.fn().mockReturnValue(Promise.resolve(requestResult))
      props.routingStore.pathContains = jest.fn().mockReturnValue(false)
      props.apiStore.currentUser.terms_accepted = false
      wrapper = shallow(
        <Routes.wrappedComponent {...props} />
      )
    })
    it('blurs the content if terms have not been accepted', () => {
      expect(wrapper.find('AppWrapper').props().blur).toBeTruthy()
    })
    it('displays the TermsOfUseModal', () => {
      expect(wrapper.find('TermsOfUseModal').exists()).toBeTruthy()
    })
  })

  describe('with anonymous user', () => {
    beforeEach(() => {
      props.apiStore.currentUser.terms_accepted = true
      props.routingStore.pathContains = jest.fn().mockReturnValue(true)
      props.isAnonymous = true
      wrapper = shallow(
        <Routes.wrappedComponent {...props} />
      )
    })

    
    it('makes NO API call to fetch the user', () => {
      expect(apiStore.loadCurrentUserAndGroups).not.toBeCalled()
    })

    it('does not blur the content if terms have been accepted', () => {
      expect(wrapper.find('AppWrapper').props().blur).toBeFalsy()
    })

    it('does not display the TermsOfUseModal', () => {
      expect(wrapper.find('TermsOfUseModal').exists()).toBeFalsy()
    })
  })

})
