import Comment from '~/ui/threads/Comment'
import { fakeComment, fakeUser } from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

jest.mock('../../../app/javascript/stores')

const fakeEvent = {
  target: { closest: jest.fn() },
}

let wrapper, props, rerender
describe('Comment', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
      comment: {
        ...fakeComment,
        persisted: true,
        replies: [fakeComment, fakeComment, fakeComment],
      },
      isReply: false,
      viewMoreReplies: jest.fn(),
    }
    rerender = props => {
      wrapper = shallow(<Comment.wrappedComponent {...props} />)
    }
    rerender(props)
  })

  it('renders the author name and avatar', () => {
    expect(
      wrapper
        .find('.author')
        .children()
        .text()
    ).toContain(props.comment.author.name)
    expect(wrapper.find('Avatar').props().url).toEqual(
      props.comment.author.pic_url_square
    )
  })

  it('renders the message', () => {
    expect(wrapper.find('Linkify').props().children).toEqual(
      props.comment.message
    )
  })

  it('renders the timestamp', () => {
    expect(wrapper.find('Moment').props().date).toEqual(
      props.comment.created_at
    )
  })

  it('does not show an edited indicator', () => {
    expect(wrapper.find('EditedIndicator').exists()).toBe(false)
  })

  describe('when the comment has been edited', () => {
    beforeEach(() => {
      props.comment.wasEdited = true
      rerender(props)
    })

    it('shows an edited indicator', () => {
      expect(wrapper.find('EditedIndicator').exists()).toBe(true)
    })
  })

  it('fetches replies (which will set replying to comment) when component is clicked', () => {
    wrapper.simulate('click', fakeEvent)
    expect(props.comment.API_fetchReplies).toHaveBeenCalled()
  })

  it('fetches replies (which will set replying to comment) when reply button clicked', () => {
    wrapper.find('.test-reply-comment').simulate('click', fakeEvent)
    expect(props.comment.API_fetchReplies).toHaveBeenCalled()
  })

  describe('if a comment is a reply', () => {
    beforeEach(() => {
      props.isReply = true
      rerender(props)
    })

    it('should not have a reply button', () => {
      expect(wrapper.find('.test-reply-comment').exists()).toBeFalsy()
    })
  })

  describe('when user is comment author', () => {
    beforeEach(() => {
      props.apiStore.currentUserId = '1'
    })

    it('renders an edit button', () => {
      expect(wrapper.find('.test-edit-comment').exists()).toBe(true)
    })

    describe('on click edit', () => {
      beforeEach(() => {
        const editButton = wrapper.find('.test-edit-comment').first()
        editButton.simulate('click')
      })

      it('shows a button to cancel editing', () => {
        expect(wrapper.find('CancelEditButton').exists()).toBe(true)
      })

      describe('on click cancel edit button', () => {
        it('closes out of editing mode', () => {
          const editButton = wrapper.find('CancelEditButton').first()
          editButton.simulate('click')
          expect(wrapper.find('CancelEditButton').exists()).toBe(false)
        })
      })
    })

    it('does not render a delete button', () => {
      expect(wrapper.find('.test-delete-comment').exists()).toBe(false)
    })

    describe('when a comment has no replies', () => {
      beforeEach(() => {
        props.comment.replies = []
        rerender(props)
      })

      it('renders a delete button', () => {
        expect(wrapper.find('.test-delete-comment').exists()).toBe(true)
      })

      describe('on click delete', () => {
        it('deletes the comment', () => {
          const deleteButton = wrapper.find('.test-delete-comment').first()
          deleteButton.simulate('click')
          expect(props.uiStore.confirm).toHaveBeenCalled()
        })
      })
    })
  })

  describe('when user is not the comment author', () => {
    beforeEach(() => {
      props.apiStore.currentUserId = '1'
      props.comment.author = { ...fakeUser, id: '9' }
      rerender(props)
    })
    it('does not render an edit button', () => {
      expect(wrapper.find('.test-edit-comment').exists()).toBe(false)
    })
    it('does not render a delete button', () => {
      expect(wrapper.find('.test-delete-comment').exists()).toBe(false)
    })
  })
})
