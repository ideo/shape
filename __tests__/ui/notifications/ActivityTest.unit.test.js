import ActivityTest from '~/ui/notifications/ActivityTest'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { fakeCollection } from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props
const fakeTestCollection = Object.assign({}, fakeCollection, {
  live_test_collection_id: 234,
})

describe('ActivityTest', () => {
  beforeEach(() => {
    const uiStore = fakeUiStore
    uiStore.viewingCollection = fakeTestCollection
    props = {
      apiStore: fakeApiStore({
        requestResult: { data: fakeTestCollection },
      }),
      uiStore,
    }
    wrapper = shallow(<ActivityTest.wrappedComponent {...props} />)
  })

  describe('render', () => {
    describe('with a test collection', () => {
      beforeEach(() => {
        const testCollection = Object.assign({}, fakeTestCollection, {
          test_status: 'live',
        })
        wrapper.setState({ testCollection })
      })

      it('should render a test survey responder with collection', () => {
        expect(wrapper.find(TestSurveyResponder).exists()).toBe(true)
      })
    })

    describe('without a test collection', () => {
      beforeEach(() => {
        props.apiStore = fakeApiStore({
          requestResult: { data: {} },
        })
        wrapper = shallow(<ActivityTest.wrappedComponent {...props} />)
      })

      it('should not render the test survey responder', () => {
        expect(wrapper.find(TestSurveyResponder).exists()).toBe(false)
      })
    })

    describe('with a closed test', () => {
      beforeEach(() => {
        wrapper.setState({ noTestCollection: true })
      })

      it('it should render a survey closed message', () => {
        expect(wrapper.find('SurveyClosed').exists()).toBe(true)
      })
    })
  })

  describe('componentDidMount', () => {
    const testCollection = Object.assign({}, fakeTestCollection, { id: 99 })

    beforeEach(() => {
      props.apiStore.fetch.mockReturnValue(testCollection)
      wrapper = shallow(<ActivityTest.wrappedComponent {...props} />)
    })

    it('should fetch the test collection', () => {
      expect(props.apiStore.fetch).toHaveBeenCalled()
    })

    describe('if there is a survey response already for the user', () => {
      beforeEach(() => {
        const respondedTestCollection = Object.assign({}, testCollection, {
          survey_response_for_user_id: 57,
        })
        props.apiStore.fetch.mockReturnValue({ data: respondedTestCollection })
        wrapper = shallow(<ActivityTest.wrappedComponent {...props} />)
      })

      it('should fetch the survey response', () => {
        expect(props.apiStore.fetch).toHaveBeenCalledWith(
          'survey_responses',
          57
        )
      })
    })
  })
})
