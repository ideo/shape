import VideoItemCover from '~/ui/grid/covers/VideoItemCover'

import {
  fakeVideoItem,
} from '#/mocks/data'

const props = {
  item: fakeVideoItem,
  dragging: false,
}

let wrapper
describe('VideoItemCover', () => {
  beforeEach(() => {
    wrapper = shallow(
      <VideoItemCover {...props} />
    )
  })

  it('renders the StyledVideoCover', () => {
    expect(wrapper.find('StyledVideoCover').exists()).toBe(true)
  })

  it('passes the thubmnail_url to StyledImageCover', () => {
    expect(wrapper.find('StyledImageCover').props().url).toEqual(fakeVideoItem.thumbnail_url)
  })

  it('does not play ReactPlayer by default', () => {
    expect(wrapper.state().playing).toBe(false)
    expect(wrapper.find('ReactPlayer').props().playing).toBe(false)
  })

  it('opens an auto-playing ReactPlayer when clicking the play button', () => {
    wrapper.find('button').simulate('click')
    expect(wrapper.state().playing).toBe(true)
    expect(wrapper.find('ReactPlayer').props().playing).toBe(true)
    expect(wrapper.find('ReactPlayer').props().url).toEqual(fakeVideoItem.url)
  })
})
