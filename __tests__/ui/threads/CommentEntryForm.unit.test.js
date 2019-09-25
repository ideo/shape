import CommentEntryForm from '~/ui/threads/CommentEntryForm'
import { fakeThread } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props
describe('CommentEntryForm', () => {
  beforeEach(() => {
    props = {
      uiStore: fakeUiStore,
      expanded: true,
      afterSubmit: jest.fn(),
      onHeightChange: jest.fn(),
      thread: fakeThread,
    }
    wrapper = shallow(<CommentEntryForm.wrappedComponent {...props} />)
    fakeThread.API_saveComment.mockClear()
  })

  it('renders the CommentInputWrapper', () => {
    expect(wrapper.find('StyledCommentInputWrapper').exists()).toBeTruthy()
  })

  describe('when not expanded', () => {
    beforeEach(() => {
      wrapper.setProps({ ...props, expanded: false })
    })

    it('does not render the CommentInputWrapper', () => {
      expect(wrapper.find('StyledCommentInputWrapper').exists()).toBeFalsy()
    })
  })
})
