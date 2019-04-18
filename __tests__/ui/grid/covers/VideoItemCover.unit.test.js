import VideoItemCover from '~/ui/grid/covers/VideoItemCover'
import { fakeVideoItem } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

// because of Activity.trackActivity('viewed', item)
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

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
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

  describe('with an item with a pending video transcode', () => {
    beforeEach(() => {
      wrapper = shallow(
        <VideoItemCover
          {...props}
          item={{ ...fakeVideoItem, pending_transcoding: true }}
        />
      )
    })

    it('renders the "upload processing" message', () => {
      expect(wrapper.find('StyledDisplayText div').text()).toContain(
        'Your video upload is currently processing'
      )
    })
  })
})
