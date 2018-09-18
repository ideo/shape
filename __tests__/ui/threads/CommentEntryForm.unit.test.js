import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import { fakeThread } from '#/mocks/data'

let wrapper, props, component
describe('CommentEntryForm', () => {
  beforeEach(() => {
    props = {
      expanded: true,
      afterSubmit: jest.fn(),
      thread: fakeThread,
    }
    wrapper = shallow(<CommentEntryForm {...props} />)
    fakeThread.API_saveComment.mockClear()
    component = wrapper.instance()
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

    it('does not call thread.API_saveComment if message is blank', () => {
      component.commentData = {
        message: '',
        draftjs_data: {},
      }
      component.handleSubmit({ preventDefault: jest.fn() })
      expect(fakeThread.API_saveComment).not.toHaveBeenCalled()
    })

    it('calls thread.API_saveComment on submit', () => {
      component.commentData = {
        message: 'hello',
        draftjs_data: { blocks: [] },
      }
      component.handleSubmit({ preventDefault: jest.fn() })
      expect(fakeThread.API_saveComment).toHaveBeenCalled()
    })
  })
})
