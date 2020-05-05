import Avatar from '~/ui/global/Avatar'
import AvatarGroup, { MAX_AVATARS_TO_SHOW } from '~/ui/global/AvatarGroup'

let wrapper, props
const rerender = () => {
  wrapper = shallow(
    <AvatarGroup {...props}>
      <Avatar />
    </AvatarGroup>
  )
}
describe('AvatarGroup', () => {
  describe('with less than max number of avatars', () => {
    beforeEach(() => {
      props = {
        avatarCount: MAX_AVATARS_TO_SHOW - 1,
        placeholderTitle: '...and more users',
      }
      rerender()
    })

    it('renders the children', () => {
      expect(wrapper.find('Avatar').exists()).toBe(true)
    })

    it('does not render a placeholder avatar for extra users', () => {
      expect(wrapper.find('.placeholder').exists()).toBe(false)
    })
  })

  describe('with the max number of avatars', () => {
    beforeEach(() => {
      props = {
        avatarCount: MAX_AVATARS_TO_SHOW,
        placeholderTitle: '...and more users',
      }

      rerender()
    })

    it('does not render a placeholder avatar for extra users', () => {
      expect(wrapper.find('.placeholder').exists()).toBe(false)
    })
  })

  describe('with more than max number of avatars', () => {
    beforeEach(() => {
      props = {
        avatarCount: MAX_AVATARS_TO_SHOW + 1,
        placeholderTitle: '...and more users',
      }

      rerender()
    })

    it('renders a placeholder avatar for extra users', () => {
      // the one passed in Avatar plus the placeholder = 2
      expect(wrapper.find('Avatar').length).toEqual(2)
      expect(wrapper.find('.placeholder').exists()).toBe(true)
    })
  })
})
