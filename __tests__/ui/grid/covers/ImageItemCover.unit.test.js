import ImageItemCover from '~/ui/grid/covers/ImageItemCover'

import {
  fakeImageItem,
} from '#/mocks/data'

const props = {
  item: fakeImageItem,
}

let wrapper
describe('ImageItemCover', () => {
  beforeEach(() => {
    wrapper = shallow(
      <ImageItemCover {...props} />
    )
  })

  it('renders the StyledImageItem', () => {
    expect(wrapper.find('StyledCover').exists()).toBe(true)
  })

  it('passes the url to StyledCover', () => {
    expect(wrapper.find('StyledCover').props().url).toEqual(fakeImageItem.filestack_file.url)
  })
})
