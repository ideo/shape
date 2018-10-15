import TestSurveyPage from '~/ui/pages/TestSurveyPage'
import { fakeCollection } from '#/mocks/data'

let wrapper, props

describe('TestSurveyPage', () => {
  describe('Live Survey', () => {
    beforeEach(() => {
      props = {
        collection: Object.assign({}, fakeCollection, { test_status: 'live' }),
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
        collection: Object.assign({}, fakeCollection, {
          test_status: 'closed',
        }),
      }
      wrapper = shallow(<TestSurveyPage {...props} />)
    })

    it('renders StyledSurveyClosed', () => {
      expect(wrapper.find('StyledSurveyClosed').exists()).toEqual(true)
      expect(
        wrapper
          .find('StyledSurveyClosed')
          .find('LearnMoreLink')
          .exists()
      ).toEqual(true)
    })

    it('does not render TestSurveyResponder', () => {
      expect(wrapper.find('TestSurveyResponder').exists()).toEqual(false)
    })
  })
})
