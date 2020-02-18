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
        filter: 'nothing',
      })
    })
  })

  describe('with video password props', () => {
    it('sends password props to GenericLinkCreator', () => {
      component.setState({
        passwordRequired: true,
        password: '1234',
      })
      wrapper.update()

      expect(wrapper.find('GenericLinkCreator').props().password).toEqual(
        '1234'
      )
      expect(
        wrapper.find('GenericLinkCreator').props().passwordField
      ).toBeTruthy()
    })
  })

  describe('with generic link url', () => {
    it('calls createCard with link metadata when link is valid', () => {
      const meta = {
        title: 'My Site',
        content: 'Site content here',
        image: 'http://image.url',
        icon: 'http://image.url/icon',
        url: 'http://cnn.com',
      }
      component.state = {
        urlValid: 'link',
        url: 'http://cnn.com',
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
  })
  describe('createLinkItem', () => {
    it('calls createCard with correct URL protocol for external site links', () => {
      const meta = {
        title: 'My Site',
        content: 'Site content here',
        image: 'http://image.url',
        icon: 'http://image.url/icon',
        url: 'https://cnn.com',
      }
      component.state = {
        urlValid: 'link',
        // if user typed cnn.com, the meta.url should still have a protocol
        url: 'cnn.com',
        meta,
      }
      component.createLinkItem()
      expect(props.createCard).toHaveBeenCalledWith({
        item_attributes: {
          type: ITEM_TYPES.LINK,
          url: meta.url,
          name: meta.title,
          content: meta.description,
          thumbnail_url: meta.image,
          icon_url: meta.icon,
        },
      })
    })
  })
})
