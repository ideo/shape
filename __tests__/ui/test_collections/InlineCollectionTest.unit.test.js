import InlineCollectionTest from '~/ui/test_collections/InlineCollectionTest'
import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { fakeCollection } from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props, uiStore, respondedTestCollection, rerender
const fakeTestCollection = {
  // NOTE: weird error when using fakeCollection and its fakeCollectionCards...
  // would get "maximum call stack", so we just create a simpler data set here
  id: '101',
  question_cards: [{ id: '1', record: {} }],
}

describe('InlineCollectionTest', () => {
  beforeEach(() => {
    uiStore = fakeUiStore
    fakeCollection.fullyLoaded = true
    uiStore.viewingCollection = fakeCollection
    props = {
      apiStore: fakeApiStore({
        requestResult: { data: fakeTestCollection },
      }),
      uiStore,
      testCollectionId: '101',
    }
    rerender = () => {
      wrapper = shallow(<InlineCollectionTest.wrappedComponent {...props} />)
    }
    rerender()
  })

  describe('render', () => {
    describe('with a test collection', () => {
      beforeEach(() => {
        const testCollection = {
          ...fakeTestCollection,
          survey_response_for_user_id: null,
          test_status: 'live',
        }
        props.apiStore = fakeApiStore({
          requestResult: { data: testCollection },
        })
        props.testCollectionId = testCollection.id
        rerender()
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
        rerender()
      })

      it('should not render the test survey responder', () => {
        expect(wrapper.find(TestSurveyResponder).exists()).toBe(false)
      })
    })

    describe('with a closed test', () => {
      beforeEach(() => {
        props.testCollectionId = null
        rerender()
      })

      it('it should render a survey closed message', () => {
        expect(wrapper.find('SurveyClosed').exists()).toBe(true)
      })
    })
  })

  describe('componentDidMount', () => {
    const testCollection = { ...fakeTestCollection, id: '101' }

    beforeEach(() => {
      props.testCollectionId = '101'
      rerender()
    })

    it('should fetch the test collection', () => {
      expect(props.apiStore.request).toHaveBeenCalledWith(
        `test_collections/${props.testCollectionId}`
      )
    })

    describe('if the testCollection is_submission_test', () => {
      beforeEach(() => {
        respondedTestCollection = {
          ...testCollection,
          API_getNextAvailableTest: jest.fn(),
          is_submission_test: true,
        }
        props.apiStore = fakeApiStore({
          requestResult: { data: respondedTestCollection },
        })
        rerender()
      })

      it('should check for the next available test', () => {
        expect(
          respondedTestCollection.API_getNextAvailableTest
        ).toHaveBeenCalled()
      })
    })
  })
})
