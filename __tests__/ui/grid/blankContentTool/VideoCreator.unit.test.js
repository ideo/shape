import VideoCreator from '~/ui/grid/blankContentTool/VideoCreator'
import { ITEM_TYPES } from '~/utils/variables'

const e = { preventDefault: jest.fn() }
let wrapper, props, component
describe('MovableGridCard', () => {
  beforeEach(() => {
    props = {
      loading: false,
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn()
    }
    props.createCard.mockClear()
    wrapper = shallow(
      <VideoCreator {...props} />
    )
    component = wrapper.instance()
  })

  it('renders a GenericLinkCreator', () => {
    expect(wrapper.find('GenericLinkCreator').exists()).toBeTruthy()
  })

  it('calls createCard with video data when url is valid', () => {
    component.state = {
      videoUrl: 'https://www.youtube.com/watch?v=zDB3NvF9LSI',
      urlValid: true,
      name: 'Youtube Video',
      thumbnailUrl: 'http://youtube.com/thumb'
    }
    component.createVideoItem(e)
    expect(props.createCard).toHaveBeenCalledWith({
      item_attributes: {
        type: ITEM_TYPES.VIDEO,
        url: component.state.videoUrl,
        name: component.state.name,
        thumbnail_url: component.state.thumbnailUrl,
      },
    })
  })

  it('does not call createCard when link is invalid', () => {
    component.state = {
      videoUrl: 'httpmy.url.com',
      urlValid: false,
    }
    component.createVideoItem(e)
    expect(props.createCard).not.toHaveBeenCalled()
  })
})
