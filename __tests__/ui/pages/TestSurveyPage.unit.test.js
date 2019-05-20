import TestSurveyPage from '~/ui/pages/TestSurveyPage'
import { fakeCollection } from '#/mocks/data'

jest.mock('../../../app/javascript/stores/index')

let wrapper, props

describe('TestSurveyPage', () => {
  describe('Live Survey', () => {
    beforeEach(() => {
      props = {
        collection: {
          ...fakeCollection,
          test_status: 'live',
        },
      }
      wrapper = shallow(<TestSurveyPage {...props} />)
    })

    it('renders TestSurveyResponder', () => {
      expect(wrapper.find('TestSurveyResponder').exists()).toEqual(true)
    })
  })

  describe('Closed Survey', () => {
    beforeEach(() => {
      props = {
        collection: {
          ...fakeCollection,
          test_status: 'closed',
        },
      }
      wrapper = shallow(<TestSurveyPage {...props} />)
    })

    it('renders ClosedSurvey', () => {
      expect(wrapper.find('ClosedSurvey').exists()).toEqual(true)
    })

    it('does not render TestSurveyResponder', () => {
      expect(wrapper.find('TestSurveyResponder').exists()).toEqual(false)
    })
  })
})
