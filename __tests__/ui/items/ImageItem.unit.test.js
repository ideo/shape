import ImageItem from '~/ui/items/ImageItem'

import { fakeImageItem } from '#/mocks/data'

const props = {
  item: fakeImageItem,
  onCancel: jest.fn(),
}
const fakeImageUrl = 'https://filestack.img.url/123/security/token'

let wrapper
describe('ImageItem', () => {
  beforeEach(() => {
    props.item.imageUrl = jest.fn().mockReturnValue(fakeImageUrl)
    wrapper = shallow(<ImageItem {...props} />)
  })

  it('renders the StyledImage', () => {
    expect(wrapper.find('StyledImage').exists()).toBe(true)
  })

  it('passes the url and alt text to StyledImage', () => {
    expect(props.item.imageUrl).toHaveBeenCalled()
    expect(wrapper.find('StyledImage').props().src).toEqual(
      fakeImageItem.imageUrl()
    )
    expect(wrapper.find('StyledImage').props().alt).toEqual(fakeImageItem.name)
  })
})
