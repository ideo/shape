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

  it('renders the StyledImageItem', () => {
    expect(wrapper.find('StyledImageItem').exists()).toBe(true)
  })

  it('passes the url to StyledImageItem', () => {
    expect(wrapper.find('StyledImageItem').props().url).toEqual(fakeImageItem.filestack_file.url)
  })
})
