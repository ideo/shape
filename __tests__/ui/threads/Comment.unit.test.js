import Comment from '~/ui/threads/Comment'
import { fakeComment } from '#/mocks/data'

let wrapper, props
describe('Comment', () => {
  beforeEach(() => {
    props = {
      comment: fakeComment,
    }
    wrapper = shallow(
      <Comment {...props} />
    )
  })

  it('renders the author name and avatar', () => {
    expect(wrapper.find('.author').children().text()).toContain(props.comment.author.name)
    expect(wrapper.find('UserAvatar').props().user).toEqual(props.comment.author)
  })

  it('renders the message', () => {
    expect(wrapper.find('.message').text()).toEqual(props.comment.message)
  })

  it('renders the timestamp', () => {
    expect(wrapper.find('Moment').props().date).toEqual(props.comment.updated_at)
  })
})
