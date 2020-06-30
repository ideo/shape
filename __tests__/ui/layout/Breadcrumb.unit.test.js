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

  describe('truncatedItems()', () => {
    describe('multiple items that have to be truncated', () => {
      beforeEach(() => {
        props.items = [
          { name: 'Home', id: '1' },
          { name: 'Workspace problem', id: '2' },
          { name: 'A Great solution', id: '3' },
          { name: 'Solution123456781235', id: '5' },
          { name: 'IdeoProject12123456789', id: '10' },
        ] // Total chars is 79
        props.containerWidth = 625 // 50 max chars
        render()
      })

      it('marks ellipses for the middle items until it has enough chars', () => {
        const { truncatedItems } = component
        expect(truncatedItems[0].ellipses).toBeFalsy()
        expect(truncatedItems[1].ellipses).toBe(true)
        expect(truncatedItems[1].remove).toBe(true)
        expect(truncatedItems[2].ellipses).toBe(true)
        expect(truncatedItems[2].subItems.length).toEqual(4)
        expect(truncatedItems[3].ellipses).toBeFalsy()
        expect(truncatedItems[4].ellipses).toBeFalsy()
      })
    })

    describe('ellipses starts in the middle', () => {
      beforeEach(() => {
        props.items = [
          { name: 'Home', id: '1' },
          { name: 'Workspace', id: '2' },
          { name: 'Solution', id: '3' },
          { name: 'Foamcore Project', id: '5' },
          { name: 'Inside Ideo Project', id: '10' },
        ]
        props.containerWidth = 625 // 50 max chars
        render()
      })

      it('marks ellipses for the middle items and creates subItems menu', () => {
        const { truncatedItems } = component
        expect(truncatedItems[0].ellipses).toBeFalsy()
        expect(truncatedItems[1].ellipses).toBeFalsy()
        expect(truncatedItems[2].ellipses).toBe(true)
        const subItemNames = truncatedItems[2].subItems.map(i => i.name)
        expect(subItemNames).toEqual([
          'Solution',
          'Foamcore Project',
          'Inside Ideo Project',
        ])
        expect(truncatedItems[3].ellipses).toBeFalsy()
        expect(truncatedItems[4].ellipses).toBeFalsy()
      })
    })
  })
})
