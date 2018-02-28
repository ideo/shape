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

  it('renders the img tag', () => {
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('passes the url to img tag', () => {
    expect(wrapper.find('img').props().src).toEqual(fakeImageItem.filestack_file.url)
  })
})
