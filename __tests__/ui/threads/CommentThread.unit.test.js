import CommentThread from '~/ui/threads/CommentThread'
import { fakeThread, fakeComment } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, props
describe('CommentThread', () => {
  beforeEach(() => {
    props = {
      thread: fakeThread,
      uiStore: fakeUiStore,
      afterSubmit: jest.fn(),
      onEditorHeightChange: jest.fn(),
      updateContainerSize: jest.fn(),
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

  it('renders all the comments', () => {
    expect(wrapper.find('Comment').length).toEqual(props.thread.comments.length)
  })

  describe('with comments with subthread', () => {
    let comments, repliesCount
    beforeEach(() => {
      repliesCount = 25
      comments = [
        {
          ...fakeComment,
          persisted: true,
          // comment_thread api loads last 3 comments initially
          replies: [fakeComment, fakeComment, fakeComment],
          replies_count: repliesCount,
        },
      ]
      const thread = {
        ...fakeThread,
        comments: comments,
      }

      props.thread = thread
      wrapper = shallow(<CommentThread.wrappedComponent {...props} />)
    })

    it('should render one parent comment and CommentReplies', () => {
      expect(wrapper.find('Comment').length).toEqual(1)
      expect(wrapper.find('CommentReplies').length).toEqual(1)
    })
  })
})
