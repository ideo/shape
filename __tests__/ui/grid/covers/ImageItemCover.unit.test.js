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
      wrapper.setProps({ contain: true, ...props })
    })

    it('will render the background as contained if passed in as prop', () => {
      const cover = wrapper.find('StyledImageCover')
      expect(cover).toHaveStyleRule('background-size', 'contain')
    })
  })
})
