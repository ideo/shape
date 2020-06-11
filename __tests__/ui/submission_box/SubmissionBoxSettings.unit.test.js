import SubmissionBoxSettings from '~/ui/submission_box/SubmissionBoxSettings'

import { fakeCollection, fakeTestCollection } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

let props, wrapper, instance, rerender
describe('SubmissionBoxSettings', () => {
  beforeEach(() => {
    props = {
      collection: {
        ...fakeCollection,
        submissions_enabled: true,
        hide_submissions: false,
        submission_template_tests: [fakeTestCollection],
      },
      closeModal: jest.fn(),
      apiStore: fakeApiStore(),
    }
    rerender = () => {
      wrapper = shallow(<SubmissionBoxSettings.wrappedComponent {...props} />)
      instance = wrapper.instance()
    }
    rerender()
  })

  it('toggleEnabled toggles submissions_enabled', () => {
    const fakeEv = { preventDefault: jest.fn() }
    instance.toggleEnabled(fakeEv)
    expect(props.collection.submissions_enabled).toEqual(false)
    expect(props.collection.save).toHaveBeenCalled()
  })

  it('toggleHidden toggles hide_submissions', () => {
    const fakeEv = { preventDefault: jest.fn() }
    instance.toggleHidden(fakeEv)
    expect(props.collection.hide_submissions).toEqual(true)
    expect(props.collection.save).toHaveBeenCalled()
  })

  it('renders SubmissionBoxFormat', () => {
    expect(wrapper.find('SubmissionBoxFormat').props().collection).toEqual(
      props.collection
    )
  })

  it('renders audience settings', () => {
    expect(wrapper.find('AudienceSettings').exists()).toEqual(true)
  })
})
