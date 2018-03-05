import ImageItem from '~/ui/items/ImageItem'

import {
  fakeImageItem,
} from '#/mocks/data'

const props = {
  item: fakeImageItem,
}

let wrapper
describe('ImageItem', () => {
  beforeEach(() => {
    wrapper = shallow(
      <ImageItem {...props} />
    )
  })

  it('renders the StyledImage', () => {
    expect(wrapper.find('StyledImage').exists()).toBe(true)
  })

  it('passes the url and alt text to StyledImage', () => {
    expect(wrapper.find('StyledImage').props().src).toEqual(fakeImageItem.filestack_file.url)
    expect(wrapper.find('StyledImage').props().alt).toEqual(fakeImageItem.name)
  })
})
