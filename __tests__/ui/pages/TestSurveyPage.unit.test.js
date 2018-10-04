import TestSurveyPage from '~/ui/pages/TestSurveyPage'
import { fakeCollection } from '#/mocks/data'

let wrapper, props
beforeEach(() => {
  props = { collection: fakeCollection }
  wrapper = shallow(<TestSurveyPage {...props} />)
})

describe('TestSurveyPage', () => {
  it('renders TestSurveyResponder', () => {
    expect(wrapper.find('TestSurveyResponder').exists()).toEqual(true)
  })
})
