import _ from 'lodash'
import MovableGridCard from '~/ui/grid/MovableGridCard'
import { uiStore } from '~/stores'
import {
  fakeItemCard,
  fakeTextItem,
  fakePosition,
  fakeCollection,
} from '#/mocks/data'

jest.mock('../../../app/javascript/stores/index')

const props = {
  card: fakeItemCard,
  position: fakePosition,
  record: fakeTextItem,
  parent: fakeCollection,
  onDrag: jest.fn(),
  onResize: jest.fn(),
  onDragOrResizeStop: jest.fn(),
  routeTo: jest.fn(),
  canEditCollection: false,
  isUserCollection: false,
  isSharedCollection: false,
  isBoardCollection: false,
  dragOffset: { x: 0, y: 0 },
}

let wrapper, component
uiStore.apiStore = {
  currentUser: {},
}

const rerender = () => {
  wrapper = shallow(<MovableGridCard {...props} />)
}

describe('MovableGridCard', () => {
  it('renders a blank card creation tool if cardType is "blank"', () => {
    props.cardType = 'blank'
    rerender()
    expect(wrapper.find('GridCardBlank').exists()).toBeTruthy()
  })

  it('renders an empty card if cardType is "empty"', () => {
    props.cardType = 'empty'
    props.card.position = { x: 0 }
    rerender()
    expect(wrapper.find('PositionedGridCard').exists()).toBeTruthy()
    expect(wrapper.find('GridCardEmptyHotspot').exists()).toBeTruthy()
  })

  describe('as viewer, with grid cards for items and collections', () => {
    beforeEach(() => {
      props.cardType = 'items'
      rerender()
    })

    it('renders a "Rnd" Resize-n-Draggable component', () => {
      expect(wrapper.find('Rnd').exists()).toBeTruthy()
    })

    it('passes position props to Rnd component', () => {
      expect(wrapper.find('Rnd').props().size).toEqual(
        _.pick(fakePosition, ['width', 'height'])
      )
      expect(wrapper.find('Rnd').props().enableResizing.bottomRight).toBeFalsy()
      expect(wrapper.find('Rnd').props().disableDragging).toBeTruthy()
    })

    it('passes ResizeIcon to Rnd component', () => {
      const ep = wrapper.find('Rnd').props().extendsProps
      const handleComponentWrapper = shallow(<ep.handleComponent.bottomRight />)
      expect(handleComponentWrapper.find('ResizeIcon').exists()).toBeTruthy()
    })

    it('renders a GridCard component', () => {
      expect(wrapper.find('GridCard').props().card).toBe(fakeItemCard)
      expect(wrapper.find('GridCard').props().cardType).toBe('items')
      expect(wrapper.find('GridCard').props().record).toBe(fakeTextItem)
    })

    describe('with a collection thats a carousel', () => {
      beforeEach(() => {
        props.card.record.isCarousel = true
        rerender()
      })

      afterEach(() => {
        props.card.record.isCarousel = false
      })

      it('disables resizing', () => {
        expect(
          wrapper.find('Rnd').props().enableResizing.bottomRight
        ).toBeFalsy()
      })
    })
  })

  describe('as editor, with grid cards for items and collections', () => {
    beforeEach(() => {
      props.cardType = 'items'
      props.card.persisted = true
      props.canEditCollection = true
      rerender()
    })

    it('passes position props to Rnd component', () => {
      expect(wrapper.find('Rnd').props().size).toEqual(
        _.pick(fakePosition, ['width', 'height'])
      )
      expect(
        wrapper.find('Rnd').props().enableResizing.bottomRight
      ).toBeTruthy()
      expect(wrapper.find('Rnd').props().disableDragging).toBeFalsy()
    })

    describe('with card.isPinnedAndLocked', () => {
      beforeEach(() => {
        props.card.isPinnedAndLocked = true
        rerender()
      })

      it('disables dragging', () => {
        expect(wrapper.find('Rnd').props().disableDragging).toBeTruthy()
      })

      describe('when isSuperAdmin', () => {
        beforeEach(() => {
          uiStore.apiStore.currentUser.is_super_admin = true
          rerender()
        })

        it('enables dragging', () => {
          expect(wrapper.find('Rnd').props().disableDragging).toBeFalsy()
        })
      })
    })

    describe('when editing the card cover', () => {
      beforeEach(() => {
        uiStore.editingCardCover = props.card.id
        rerender()
      })

      it('disables dragging', () => {
        expect(wrapper.find('Rnd').props().disableDragging).toBeTruthy()
      })
    })
  })

  describe('when hoveringOverRight', () => {
    beforeEach(() => {
      uiStore.hoveringOver = {
        card: { id: props.card.id },
        direction: 'right',
      }
      rerender()
    })

    it('passes hoveringOver to GridCard', () => {
      expect(wrapper.find('GridCard').props().hoveringOver).toBe(true)
    })
  })

  describe('handleDrag', () => {
    beforeEach(() => {
      rerender()
      component = wrapper.instance()
    })

    it('should initiate uiStore.drag, but not call other drag functions until >10 px movement', () => {
      const pageX = 0
      const pageY = 10
      const e = { pageX, pageY }
      const data = { x: 0, y: 0 }
      component.handleDrag(e, data)
      expect(uiStore.drag).toHaveBeenCalledWith({ x: pageX, y: pageY })
      expect(uiStore.startDragging).not.toHaveBeenCalled()
    })

    describe('with >10 px movement', () => {
      it('should initiate uiStore.drag, but not call other drag functions until >10 px movement', () => {
        const pageX = 0
        const pageY = 10
        const e = { pageX, pageY }
        const data = { x: 15, y: 25 }
        component.handleDrag(e, data)
        expect(uiStore.drag).toHaveBeenCalledWith({ x: pageX, y: pageY })
        expect(uiStore.closeBlankContentTool).toHaveBeenCalled()
        expect(uiStore.reselectOnlyMovableCards).toHaveBeenCalled()
        expect(uiStore.startDragging).toHaveBeenCalledWith(props.card.id)
      })
    })
  })

  describe('componentDidUpdate', () => {
    beforeEach(() => {
      component.finishPreloading = jest.fn()
    })

    it('should call finishPreloading', () => {
      wrapper.setState({ preloading: true })
      expect(component.finishPreloading).toHaveBeenCalled()
    })

    describe('with private card', () => {
      beforeEach(() => {
        props.card = {
          ...fakeItemCard,
          isPrivate: true,
        }
        wrapper.setProps({ props })
        rerender()
      })

      it('should call finishPreloading', () => {
        wrapper.setState({ preloading: false })
        expect(component.finishPreloading).toHaveBeenCalled()
      })
    })
  })
})
