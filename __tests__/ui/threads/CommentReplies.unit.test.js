import CommentReplies from '~/ui/threads/CommentReplies'
import { fakeComment } from '#/mocks/data'

let wrapper, props
let comment = { ...fakeComment }
const repliesCount = 25

describe('CommentReplies', () => {
  beforeEach(() => {
    props = {
      comment,
      repliesLength: comment.replies.length,
    }
    wrapper = shallow(<CommentReplies {...props} />)
  })

  describe('with comments with subthread', () => {
    beforeEach(() => {
      comment = {
        ...fakeComment,
        persisted: true,
        // comment_thread api loads last 3 comments initially
        replies: [fakeComment, fakeComment, fakeComment],
        replies_count: repliesCount,
      }

      props.comment = comment
      props.repliesLength = comment.replies.length
      wrapper = shallow(<CommentReplies {...props} />)
    })

    it('should render the view more component with the right amount of comments left', () => {
      expect(wrapper.find('ViewMore').exists()).toBeTruthy()
      expect(wrapper.find('ViewMore').text()).toEqual(
        `View ${repliesCount - props.repliesLength} more`
      )
    })

    it('should render the view more component with the right amount of comments left', () => {
      expect(wrapper.find('ViewMore').exists()).toBeTruthy()
      expect(wrapper.find('ViewMore').text()).toEqual(
        `View ${repliesCount - props.repliesLength} more`
      )
    })

    describe('clicking on a parent thread', () => {
      it('should fetch remaining replies', () => {
        wrapper.instance().expandReplies()
        expect(props.comment.expandAndFetchReplies).toHaveBeenCalled()
      })
    })
  })
})
