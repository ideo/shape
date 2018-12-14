import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import { fakeVideoItem } from '#/mocks/data'

// so that it doesn't actually try to track the activity with a request
jest.mock('../../../../app/javascript/stores/jsonApi/Activity')

const props = {
  item: fakeVideoItem,
  dragging: false,
}

let wrapper
describe('VideoItemCover', () => {
  beforeEach(() => {
    wrapper = shallow(<VideoItemCover {...props} />)
  })

  it('renders the StyledVideoCover', () => {
    expect(wrapper.find('StyledVideoCover').exists()).toBe(true)
  })

  it('passes the thumbnail_url to StyledImageCover', () => {
    expect(wrapper.find('StyledImageCover').props().url).toEqual(
      fakeVideoItem.thumbnail_url
    )
  })

  it('does not play VideoPlayer by default', () => {
    expect(wrapper.state().playing).toBe(false)
    expect(wrapper.find('VideoPlayer').props().playing).toBe(false)
  })

  it('opens an auto-playing VideoPlayer when clicking the play button', () => {
    wrapper.find('button').simulate('click')
    expect(wrapper.state().playing).toBe(true)
    expect(wrapper.find('VideoPlayer').props().playing).toBe(true)
    expect(wrapper.find('VideoPlayer').props().url).toEqual(fakeVideoItem.url)
  })
})
