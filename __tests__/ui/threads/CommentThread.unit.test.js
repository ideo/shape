import CommentThread from '~/ui/threads/CommentThread'
import { fakeThread, fakeComment } from '#/mocks/data'
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
        3
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

    it('renders all the comments', () => {
      expect(wrapper.find('Comment').length).toEqual(
        // FIXME: What is the desired behavior for this to test?
        0
        // props.thread.comments.length
      )
    })
  })

  describe('with comments with subthread', () => {
    let comments, repliesCount
    beforeEach(() => {
      repliesCount = 25
      comments = [
        {
          ...fakeComment,
          persisted: true,
          replies: [fakeComment, fakeComment, fakeComment], // comment_thread api loads last 3 comments initially
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

    it('should render one parent comment and three subthreads initially', () => {
      expect(wrapper.find('Comment').length).toEqual(4)
    })

    it('should render the view more component with the right amount of comments left', () => {
      expect(wrapper.find('ViewMore').exists()).toBeTruthy()
      expect(wrapper.find('ViewMore').text()).toEqual(
        `View ${repliesCount - comments[0].replies.length} more`
      )
    })

    it('should render the view more component with the right amount of comments left', () => {
      expect(wrapper.find('ViewMore').exists()).toBeTruthy()
      expect(wrapper.find('ViewMore').text()).toEqual(
        `View ${repliesCount - comments[0].replies.length} more`
      )
    })

    describe('clicking on a parent thread', () => {
      it('should fetch remaining replies', () => {
        wrapper.instance().viewMoreReplies(comments[0])
        expect(comments[0].API_fetchReplies).toHaveBeenCalled()
      })
    })
  })
})
