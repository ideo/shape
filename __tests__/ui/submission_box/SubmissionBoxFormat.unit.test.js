import SubmissionBoxFormat from '~/ui/submission_box/SubmissionBoxFormat'
import { fakeCollection } from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'

let props, wrapper, rerender, template
describe('SubmissionBoxFormat', () => {
  beforeEach(() => {
    template = {
      name: 'Template',
      ...fakeCollection,
    }
    props = {
      collection: {
        ...fakeCollection,
        apiStore: fakeApiStore(),
      },
      closeModal: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<SubmissionBoxFormat {...props} />)
    }
    rerender()
  })

  describe('without submission format chosen', () => {
    beforeEach(() => {
      props.collection.submission_template_id = null
      props.collection.submission_box_type = null
      props.collection.submissionFormat = null
      rerender()
    })

    it('renders EditSubmissionBoxFormat', () => {
      expect(
        wrapper.find('EditSubmissionBoxFormat').props().collection
      ).toEqual(props.collection)
    })
  })

  describe('with submission template chosen', () => {
    beforeEach(() => {
      props.collection.submission_template = template
      props.collection.submission_template_id = 1234
      props.collection.submission_box_type = null
      props.collection.submissionFormat = 'template'
      rerender()
    })

    it('renders SubmissionBoxRowForTemplate', () => {
      const row = wrapper.find('SubmissionBoxRowForTemplate')
      expect(row.exists()).toEqual(true)
      expect(row.props().template).toEqual(template)
    })

    it('does not render EditSubmissionBoxFormat or SubmissionBoxRowForItem', () => {
      expect(wrapper.find('EditSubmissionBoxFormat').exists()).toEqual(false)
      expect(wrapper.find('SubmissionBoxRowForItem').exists()).toEqual(false)
    })
  })

  describe('with submission type chosen', () => {
    beforeEach(() => {
      props.collection.submission_box_type = 'text'
      props.collection.submission_template_id = null
      props.collection.submissionFormat = 'item'
      rerender()
    })

    it('renders SubmissionBoxRowForItem', () => {
      const row = wrapper.find('SubmissionBoxRowForItem')
      expect(row.exists()).toEqual(true)
      expect(row.props().type.name).toEqual('text')
    })

    it('does not render EditSubmissionBoxFormat or SubmissionBoxRowForTemplate', () => {
      expect(wrapper.find('EditSubmissionBoxFormat').exists()).toEqual(false)
      expect(wrapper.find('SubmissionBoxRowForTemplate').exists()).toEqual(
        false
      )
    })
  })
})
