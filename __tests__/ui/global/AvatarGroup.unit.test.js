import AvatarGroup, { MAX_AVATARS_TO_SHOW } from '~/ui/global/AvatarGroup'

let wrapper
describe('AvatarGroup', () => {
  describe('with less than max number of avatars', () => {
    beforeEach(() => {
      const props = {
        avatarCount: MAX_AVATARS_TO_SHOW - 1,
        placeholderTitle: '...and more users',
      }

      wrapper = shallow(<AvatarGroup {...props} />)
    })

    it('does not render a placeholder avatar for extra users', () => {
      expect(wrapper.find('.placeholder').exists()).toBe(false)
    })
  })

  describe('with the max number of avatars', () => {
    beforeEach(() => {
      const props = {
        avatarCount: MAX_AVATARS_TO_SHOW,
        placeholderTitle: '...and more users',
      }

      wrapper = shallow(<AvatarGroup {...props} />)
    })

    it('does not render a placeholder avatar for extra users', () => {
      expect(wrapper.find('.placeholder').exists()).toBe(false)
    })
  })

  describe('with more than max number of avatars', () => {
    beforeEach(() => {
      const props = {
        avatarCount: MAX_AVATARS_TO_SHOW + 1,
        placeholderTitle: '...and more users',
      }

      wrapper = shallow(<AvatarGroup {...props} />)
    })

    it('renders a placeholder avatar for extra users', () => {
      expect(wrapper.find('.placeholder').exists()).toBe(true)
    })
  })
})
