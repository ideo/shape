import InlineCollectionTest from '~/ui/test_collections/InlineCollectionTest'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { fakeCollection } from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props, uiStore
const fakeTestCollection = {
  ...fakeCollection,
  question_cards: fakeCollection.collection_cards,
}

describe('InlineCollectionTest', () => {
  beforeEach(() => {
    uiStore = fakeUiStore
    uiStore.viewingCollection = fakeTestCollection
    props = {
      apiStore: fakeApiStore({
        requestResult: { data: fakeTestCollection },
      }),
      uiStore,
    }
    wrapper = shallow(<InlineCollectionTest.wrappedComponent {...props} />)
  })

  describe('render', () => {
    describe('with a test collection', () => {
      beforeEach(() => {
        const testCollection = {
          ...fakeTestCollection,
          survey_response_for_user_id: null,
          test_status: 'live',
        }
        props.uiStore.viewingCollection.live_test_collection = testCollection
        wrapper = shallow(<InlineCollectionTest.wrappedComponent {...props} />)
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
        props.uiStore.viewingCollection.live_test_collection = null
        wrapper = shallow(<InlineCollectionTest.wrappedComponent {...props} />)
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
    const testCollection = { ...fakeTestCollection, id: 99 }

    beforeEach(() => {
      props.uiStore.viewingCollection.live_test_collection = { id: 99 }
      wrapper = shallow(<InlineCollectionTest.wrappedComponent {...props} />)
    })

    it('should fetch the test collection', () => {
      expect(props.apiStore.request).toHaveBeenCalled()
    })

    describe('if there is a survey response already for the user', () => {
      beforeEach(() => {
        const respondedTestCollection = {
          ...testCollection,
          survey_response_for_user_id: 57,
        }
        props.apiStore.request.mockReturnValue({
          data: respondedTestCollection,
        })
        wrapper = shallow(<InlineCollectionTest.wrappedComponent {...props} />)
      })

      it('should fetch the survey response', () => {
        expect(props.apiStore.fetch).toHaveBeenCalledWith(
          'survey_responses',
          57
        )
      })
    })

    describe('if the testCollection is_submission_test', () => {
      beforeEach(() => {
        const respondedTestCollection = {
          ...testCollection,
          is_submission_test: true,
        }
        props.apiStore.request.mockReturnValue({
          data: respondedTestCollection,
        })
        wrapper = shallow(<InlineCollectionTest.wrappedComponent {...props} />)
      })

      it('should check for the next available test', () => {
        expect(testCollection.API_getNextAvailableTest).toHaveBeenCalled()
      })
    })
  })
})
