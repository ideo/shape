import CommentThread from '~/ui/threads/CommentThread'
import { fakeThread } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props

describe('CommentThread', () => {
  beforeEach(() => {
    props = {
      expanded: false,
      onClick: jest.fn(),
      afterSubmit: jest.fn(),
      onEditorHeightChange: jest.fn(),
      thread: fakeThread,
      uiStore: fakeUiStore,
    }
    wrapper = shallow(<CommentThread.wrappedComponent {...props} />)
  })

  it('renders a CommentThreadHeader with the thread', () => {
    expect(wrapper.find('CommentThreadHeader').exists()).toBeTruthy()
  })

  it('renders a CommentEntryForm', () => {
    // NOTE: textarea is just shown/hidden via "expanded" prop so it should always exist
    expect(wrapper.find('CommentEntryForm').exists()).toBeTruthy()
    expect(wrapper.find('CommentEntryForm').props().expanded).toEqual(
      props.expanded
    )
  })

  describe('with unexpanded thread', () => {
    it('renders unread comments if thread is unexpanded', () => {
      // fakeThread has 2 latestUnreadComments
      // FIXME: What is the desired behavior for this to test?
      expect(wrapper.find('Comment').length).toEqual(
        0
        // props.thread.latestUnreadComments.length
      )
    })

    it('makes the StyledCommentsWrapper clickable', () => {
      const styledWrapper = wrapper.find('StyledCommentsWrapper').get(0)
      expect(styledWrapper.props.clickable).toBeTruthy()
      styledWrapper.props.onClick()
      // should call the function passed in to CommentThread
      expect(props.onClick).toHaveBeenCalled()
    })
  })

  describe('with expanded thread', () => {
    beforeEach(() => {
      props = {
        ...props,
        expanded: true,
      }
      wrapper = shallow(<CommentThread {...props} />)
    })

    it('renders all the comments if thread is expanded', () => {
      expect(wrapper.find('Comment').length).toEqual(
        // FIXME: What is the desired behavior for this to test?
        0
        // props.thread.comments.length
      )
    })
  })
})
