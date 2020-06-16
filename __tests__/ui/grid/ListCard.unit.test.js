import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'
import ListCard from '~/ui/grid/ListCard'
import { ITEM_TYPES } from '~/utils/variables'
import { routingStore, uiStore } from '~/stores'
import { fakeCollectionCard, fakeTextItem } from '#/mocks/data'
import TextIconXs from '~/ui/icons/TextIconXs'
import VideoIcon from '~/ui/icons/VideoIcon'
import { openContextMenu } from '~/utils/clickUtils'

jest.mock('../../../app/javascript/stores')
jest.mock('../../../app/javascript/utils/clickUtils')

const card = fakeCollectionCard
card.record = fakeTextItem
const fakeEv = {
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  persist: jest.fn(),
}
let wrapper, component, props, render

describe('ListCard', () => {
  beforeEach(() => {
    props = {
      card,
    }
    render = () => {
      wrapper = shallow(<ListCard {...props} />)
      component = wrapper.instance()
    }
    render()
  })

  describe('on record click', () => {
    it('should route to the record', () => {
      const link = wrapper.find('ColumnLink').first()
      link.simulate('click', fakeEv)
      expect(routingStore.routeTo).toHaveBeenCalledWith(
        card.record.internalType,
        card.record.id
      )
    })

    it('should stop event propagation', () => {
      expect(fakeEv.stopPropagation).toHaveBeenCalled()
      expect(fakeEv.preventDefault).toHaveBeenCalled()
    })
  })

  describe('on row click', () => {
    beforeEach(() => {
      const row = wrapper.find('[data-cy="ListCardRow"]')
      row.simulate('click', fakeEv)
    })

    it('should capture global keyboard grid click', () => {
      expect(uiStore.captureKeyboardGridClick).toHaveBeenCalled()
    })

    it('should toggle selected card in uiStore', () => {
      expect(uiStore.toggleSelectedCardId).toHaveBeenCalled()
      expect(uiStore.toggleSelectedCardId).toHaveBeenCalledWith(card.id)
    })
  })

  describe('on right click', () => {
    beforeEach(() => {
      const row = wrapper.find('[data-cy="ListCardRow"]')
      row.simulate('contextmenu', fakeEv)
    })

    it('should prevent default', () => {
      expect(fakeEv.preventDefault).toHaveBeenCalled()
    })

    it('should open the context menu via clickUtils', () => {
      expect(openContextMenu).toHaveBeenCalled()
    })
  })

  describe('on action menu click', () => {
    beforeEach(() => {
      component.handleActionMenuClick(fakeEv)
    })

    it('should stop event propagation', () => {
      expect(fakeEv.stopPropagation).toHaveBeenCalled()
    })

    it('should open the context menu in ui store', () => {
      expect(uiStore.openContextMenu).toHaveBeenCalled()
    })
  })

  describe('on roles click', () => {
    beforeEach(() => {
      component.handleRolesClick(fakeEv)
    })

    it('should stop event propagation', () => {
      expect(fakeEv.stopPropagation).toHaveBeenCalled()
    })

    it('should open the context menu in ui store', () => {
      expect(uiStore.update).toHaveBeenCalled()
      expect(uiStore.update).toHaveBeenCalledWith('rolesMenuOpen', card.record)
    })
  })

  describe('render()', () => {
    it('should render the correct icon', () => {
      card.record.type = ITEM_TYPES.TEXT
      render()
      expect(wrapper.find(TextIconXs).exists()).toBe(true)

      card.record.type = ITEM_TYPES.VIDEO
      render()
      expect(wrapper.find(VideoIcon).exists()).toBe(true)
    })

    it('should render the collectionTypeSelector if collection', () => {
      card.record.allowsCollectionTypeSelector = true
      render()
      expect(wrapper.find(CollectionTypeSelector).exists()).toBe(true)
    })

    describe('when card is being moved (or should be hidden)', () => {
      beforeEach(() => {
        card.shouldHideFromUI = true
        render()
      })

      it('should not render the card', () => {
        const row = wrapper.find('[data-cy="ListCardRow"]')
        expect(row.exists()).toBe(false)
      })
    })
  })
})
