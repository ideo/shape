import LinkCreator from '~/ui/grid/blankContentTool/LinkCreator'
import { ITEM_TYPES } from '~/utils/variables'

const e = { preventDefault: jest.fn() }
let wrapper, props, component
describe('LinkCreator', () => {
  beforeEach(() => {
    props = {
      type: 'link',
      loading: false,
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn(),
    }
    props.createCard.mockClear()
    wrapper = shallow(<LinkCreator {...props} />)
    component = wrapper.instance()
  })

  it('renders a GenericLinkCreator', () => {
    expect(wrapper.find('GenericLinkCreator').exists()).toBeTruthy()
  })

  describe('with video url', () => {
    it('calls createCard with video data when url is valid', () => {
      component.state = {
        url: 'https://www.youtube.com/watch?v=zDB3NvF9LSI',
        urlValid: 'video',
        name: 'Youtube Video',
        thumbnailUrl: 'http://youtube.com/thumb',
      }
      component.createItem(e)
      expect(props.createCard).toHaveBeenCalledWith({
        item_attributes: {
          type: ITEM_TYPES.VIDEO,
          url: component.state.url,
          name: component.state.name,
          thumbnail_url: component.state.thumbnailUrl,
        },
      })
    })

    it('does not call createCard when link is invalid', () => {
      component.state = {
        url: 'httpmy.url.com',
        urlValid: false,
      }
      component.createItem(e)
      expect(props.createCard).not.toHaveBeenCalled()
    })
  })

  describe('with generic link url', () => {
    it('calls createCard with link metadata when link is valid', () => {
      const meta = {
        title: 'My Site',
        content: 'Site content here',
        image: 'http://image.url',
        icon: 'http://image.url/icon',
      }
      component.state = {
        urlValid: 'link',
        url: 'http://my.url.com',
        meta,
      }
      component.createItem(e)
      expect(props.createCard).toHaveBeenCalledWith({
        item_attributes: {
          type: ITEM_TYPES.LINK,
          url: component.state.url,
          name: meta.title,
          content: meta.description,
          thumbnail_url: meta.image,
          icon_url: meta.icon,
        },
      })
    })

    it('does not call createCard when link is invalid', () => {
      component.state = {
        urlValid: false,
        url: 'httpmy.url.com',
        meta: {},
      }
      component.createItem(e)
      expect(props.createCard).not.toHaveBeenCalled()
    })
  })
})
