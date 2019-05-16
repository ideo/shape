import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import { fakeThread } from '#/mocks/data'

let wrapper, props
describe('CommentEntryForm', () => {
  beforeEach(() => {
    props = {
      expanded: true,
      afterSubmit: jest.fn(),
      thread: fakeThread,
    }
    wrapper = shallow(<CommentEntryForm {...props} />)
    fakeThread.API_saveComment.mockClear()
  })

  describe('when not expanded', () => {
    beforeEach(() => {
      wrapper.setProps({ ...props, expanded: false })
    })

    it('does not render the CommentInput box', () => {
      expect(wrapper.find('CommentInput').exists()).toBeFalsy()
    })
  })

  describe('when expanded', () => {
    beforeEach(() => {
      wrapper.setProps({ ...props, expanded: true })
    })

    it('renders the CommentInput box', () => {
      expect(wrapper.find('CommentInput').exists()).toBeTruthy()
    })
  })
})
