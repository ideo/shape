import TestSurveyPage from '~/ui/pages/TestSurveyPage'
import { fakeCollection, fakeUser } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, props

describe('TestSurveyPage', () => {
  beforeEach(async () => {
    props = {
      apiStore: fakeApiStore(),
    }
    // this is how the TestSurveyPage loads this.collection
    props.apiStore.sync = jest.fn().mockReturnValue(fakeCollection)
    props.apiStore.currentUser = null
    // await because of async componentDidMount
    wrapper = await shallow(<TestSurveyPage.wrappedComponent {...props} />)
    wrapper.update()
  })

  describe('Live Survey', () => {
    it('renders TestSurveyResponder', () => {
      expect(wrapper.find('TestSurveyResponder').exists()).toEqual(true)
    })

    it('does not render RespondentBanner', () => {
      expect(wrapper.find('RespondentBanner').exists()).toEqual(false)
    })
  })

  describe('with a currentUser', () => {
    beforeEach(async () => {
      props.apiStore.currentUser = fakeUser
      wrapper = await shallow(<TestSurveyPage.wrappedComponent {...props} />)
      wrapper.update()
    })

    it('renders RespondentBanner', () => {
      expect(wrapper.find('RespondentBanner').exists()).toEqual(true)
    })
  })
})
