import HotCellQuadrant, { Quadrant } from '~/ui/grid/HotCellQuadrant'
import LinkIcon from '~/ui/icons/htc/LinkIcon'
import PlusIcon from '~/ui/icons/PlusIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import TextIcon from '~/ui/icons/htc/TextIcon'

import fakeUiStore from '#/mocks/fakeUiStore'

let wrapper, uiStore

describe('HotCellQuadrant', () => {
  let rerender
  let props = {}
  const fakeEv = { preventDefault: jest.fn(), stopPropagation: jest.fn() }

  beforeEach(() => {
    uiStore = fakeUiStore
    props = {
      uiStore,
      name: 'text',
      description: 'Create text',
      onCreateContent: jest.fn(),
      onMoreMenuOpen: jest.fn(),
      onMoreMenuClose: jest.fn(),
      subTypes: [],
      currentMenuOpen: true,
      zoomLevel: 1,
    }
    rerender = (opts = {}) => {
      const newProps = { ...props, ...opts }
      wrapper = shallow(<HotCellQuadrant.wrappedComponent {...newProps} />)
    }
    rerender()
  })

  describe('render()', () => {
    it('displays the correct Type icon', () => {
      expect(wrapper.find(TextIcon).exists()).toBe(true)
    })

    describe('on the item quadrant', () => {
      beforeEach(() => {
        rerender({
          name: 'file',
          description: 'Add a file',
          subTypes: [
            { name: 'link', description: 'Add Link' },
            { name: 'video', description: 'Link Video' },
            { name: 'report', description: 'Create Report' },
          ],
        })
      })

      it('renders the more interface', () => {
        expect(wrapper.find('More').exists()).toBe(true)
      })

      it('rerenders the subtypes', () => {
        const popout = wrapper.find(PopoutMenu)
        expect(popout.exists()).toBe(true)

        expect(popout.props().menuItems).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Add Link',
              iconLeft: <LinkIcon />,
            }),
          ])
        )
      })
    })

    describe('when its the template quadrant', () => {
      beforeEach(() => {
        rerender({ name: 'template' })
      })

      it('should render the PlusIcon', () => {
        expect(wrapper.find(PlusIcon).exists()).toBe(true)
      })
    })
  })

  describe('handleClick', () => {
    beforeEach(() => {
      const quadrant = wrapper.find(Quadrant)
      quadrant.simulate('click', {})
    })

    it('should call the onCreateContent prop with the name', () => {
      expect(props.onCreateContent).toHaveBeenCalled()
      expect(props.onCreateContent).toHaveBeenCalledWith('text', undefined)
    })
  })

  describe('handleMore', () => {
    beforeEach(() => {
      rerender({
        name: 'file',
        description: 'Add a file',
        subTypes: [{ name: 'link', description: 'Add Link' }],
      })
      const more = wrapper.find('More')
      more.simulate('click', fakeEv)
    })

    it('should open the popout menu', () => {
      const popout = wrapper.find(PopoutMenu)
      expect(popout.exists()).toBe(true)
      expect(popout.props().menuOpen).toBe(true)
    })
  })

  describe('handleMoreMenuClose', () => {
    beforeEach(() => {
      rerender({
        name: 'file',
        description: 'Add a file',
        subTypes: [{ name: 'link', description: 'Add Link' }],
        currentMenuOpen: false,
      })
    })

    it('should clse the popout menu', () => {
      const popout = wrapper.find(PopoutMenu)
      expect(popout.exists()).toBe(true)
      expect(popout.props().menuOpen).toBe(false)
    })
  })
})
