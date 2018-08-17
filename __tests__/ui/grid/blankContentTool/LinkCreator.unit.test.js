import LinkCreator from '~/ui/grid/blankContentTool/LinkCreator'
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
      <LinkCreator {...props} />
    )
    component = wrapper.instance()
  })

  it('renders a GenericLinkCreator', () => {
    expect(wrapper.find('GenericLinkCreator').exists()).toBeTruthy()
  })

  it('calls createCard with link metadata when link is valid', () => {
    const meta = {
      title: 'My Site',
      content: 'Site content here',
      image: 'http://image.url',
      icon: 'http://image.url/icon',
    }
    component.state = {
      urlValid: true,
      url: 'http://my.url.com',
      meta,
    }
    component.createLinkItem(e)
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
    component.createLinkItem(e)
    expect(props.createCard).not.toHaveBeenCalled()
  })
})
