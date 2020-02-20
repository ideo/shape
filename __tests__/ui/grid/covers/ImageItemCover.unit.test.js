import ImageItemCover from '~/ui/grid/covers/ImageItemCover'
import { fakeImageItem } from '#/mocks/data'

const props = {
  item: fakeImageItem,
}

let wrapper
describe('ImageItemCover', () => {
  beforeEach(() => {
    wrapper = shallow(<ImageItemCover {...props} />)
  })

  it('renders the StyledImageItem', () => {
    expect(wrapper.find('StyledImageCover').exists()).toBe(true)
  })

  it('passes the url to StyledImageCover', () => {
    expect(wrapper.find('StyledImageCover').props().url).toEqual(
      fakeImageItem.imageUrl()
    )
  })

  describe('when contain prop is true', () => {
    beforeEach(() => {
      wrapper = mount(<ImageItemCover {...props} contain />)
    })

    it('will render the background as contained if passed in as prop', () => {
      const cover = wrapper.find('StyledImageCover')
      expect(cover).toHaveStyleRule('background-size', 'contain')
    })
  })

  describe('when isTestCollectionCard is true and can_view', () => {
    beforeEach(() => {
      props.item.can_view = true
      props.isTestCollectionCard = true
      wrapper.setProps({ props })
    })

    it('does not render the fullscreen viewer', () => {
      expect(wrapper.find('Viewer').exists()).toBe(false)
    })
  })

  describe('when isTestCollectionCard is true and !can_view', () => {
    beforeEach(() => {
      props.item.can_view = false
      props.isTestCollectionCard = true
      wrapper.setProps({ props })
    })

    it('does render the fullscreen viewer', () => {
      expect(wrapper.find('Viewer').exists()).toBe(true)
    })
  })
})
