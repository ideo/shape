import Breadcrumb from '~/ui/layout/Breadcrumb'

let wrapper, component, render

describe('Breadcrumb', () => {
  let props
  let items

  beforeEach(() => {
    items = [
      { name: 'Home', id: '1', identifier: 'home', type: 'Collection' },
      { name: 'Item A', id: '3', type: 'Collection' },
      { name: 'Item B', id: '3', type: 'Collection', has_children: true },
    ]
    props = {
      items,
      onBack: jest.fn(),
      onBreadcrumbDive: jest.fn().mockReturnValue(Promise.resolve()),
      onRestore: jest.fn(),
      onBreadcrumbClick: jest.fn(),
      isHomepage: false,
    }
    render = () => {
      wrapper = shallow(<Breadcrumb {...props} />)
      component = wrapper.instance()
      // titles = component.truncatedItems.map(t => t.name)
    }
    render()
  })

  describe('render()', () => {
    it('should render all breadcrumbs', () => {
      expect(wrapper.find('BreadcrumbItem').length).toEqual(3)
    })

    describe('when rendering the back button', () => {
      beforeEach(() => {
        props.showBackButton = true
        render()
      })

      it('should only render the back button', () => {
        expect(wrapper.find('[data-cy="BreadcrumbBackButton"]').exists()).toBe(
          true
        )
      })
    })

    describe('if there are no items', () => {
      beforeEach(() => {
        props.items = []
        render()
      })

      it('should only render the breadcrumb padding', () => {
        expect(wrapper.find('BreadcrumbPadding').exists()).toBe(true)
      })
    })
  })

  describe('truncate()', () => {
    describe('multiple items that have to be truncated', () => {
      beforeEach(() => {
        props.items = [
          { name: 'Home' },
          { name: 'Workspace problem' },
          { name: 'A Great solution' },
          { name: 'Solution123456781235' },
          { name: 'IdeoProejct12123456789' },
        ] // Total chars is 79
        props.containerWidth = 625 // 50 max chars
        render()
      })

      it('do ellipses for the middle items until it has enough chars', () => {
        expect(component.truncatedItems[0].ellipses).toBeFalsy()
        expect(component.truncatedItems[1].ellipses).toBe(true)
        expect(component.truncatedItems[2].ellipses).toBe(true)
        expect(component.truncatedItems[3].ellipses).toBeFalsy()
      })
    })
  })
})
