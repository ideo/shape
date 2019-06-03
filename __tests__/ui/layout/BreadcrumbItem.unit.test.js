import { BreadcrumbItem } from '~/ui/layout/BreadcrumbItem'
import { fakeTextItem } from '#/mocks/data'

jest.mock('../../../app/javascript/stores')

const props = {
  item: fakeTextItem,
  identifier: 'item_1',
  index: 1,
  numItems: 1,
  restoreBreadcrumb: jest.fn(),
}

let wrapper

const rerender = () => {
  wrapper = shallow(<BreadcrumbItem {...props} />)
}

describe('BreadcrumbItem', () => {
  beforeEach(() => {
    rerender()
  })

  it('renders StyledBreadcrumbItem wrapper', () => {
    expect(wrapper.find('StyledBreadcrumbItem').exists()).toBeTruthy()
  })

  describe('with ellipses', () => {
    beforeEach(() => {
      wrapper.setProps({
        ...props,
        item: {
          ...props.item,
          ellipses: true,
          truncatedName: 'it',
        },
      })
    })

    it('renders a tooltip with the truncatedName', () => {
      const tooltip = wrapper.find('Tooltip')
      expect(tooltip.props().title).toEqual(props.item.name)
      expect(tooltip.find('Link').prop('children')).toEqual(['it', '…'])
    })
  })

  describe('with link', () => {
    beforeEach(() => {
      wrapper.setProps({
        ...props,
        item: {
          ...props.item,
          link: true,
        },
      })
    })

    it('renders a tooltip with the "switch to" location button', () => {
      const tooltip = wrapper.find('Tooltip')
      expect(tooltip.props().title).toMatch(`switch to ${props.item.name}`)
      expect(tooltip.find('StyledRestoreButton').exists()).toBeTruthy()
    })
  })
})
