import ListCard from '~/ui/grid/ListCard'
import { DEFAULT_COLUMNS } from '~/ui/grid/CollectionList'
import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'
import { ITEM_TYPES } from '~/utils/variables'
import TextIconXs from '~/ui/icons/TextIconXs'
import VideoIcon from '~/ui/icons/VideoIcon'
import { openContextMenu } from '~/utils/clickUtils'

import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { fakeCollectionCard, fakeTextItem } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/clickUtils')

const card = fakeCollectionCard
const fakeEv = {
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  persist: jest.fn(),
}
let wrapper, component, props, render, record

describe('ListCard', () => {
  beforeEach(() => {
    record = fakeTextItem
    props = {
      card,
      columns: [...DEFAULT_COLUMNS],
      record,
      uiStore: fakeUiStore,
      apiStore: fakeApiStore(),
      routingStore: fakeRoutingStore,
    }
    render = () => {
      wrapper = shallow(<ListCard.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    render()
  })

  describe('on record click', () => {
    it('should route to the record', () => {
      const link = wrapper.find('ColumnLink').first()
      link.simulate('click', fakeEv)
      expect(props.routingStore.routeTo).toHaveBeenCalledWith(
        record.internalType,
        record.id
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
      expect(props.uiStore.captureKeyboardGridClick).toHaveBeenCalled()
    })

    it('should toggle selected card in uiStore', () => {
      expect(props.uiStore.toggleSelectedCardId).toHaveBeenCalled()
      expect(props.uiStore.toggleSelectedCardId).toHaveBeenCalledWith(card.id)
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
      expect(props.uiStore.openContextMenu).toHaveBeenCalled()
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
      expect(props.uiStore.update).toHaveBeenCalled()
      expect(props.uiStore.update).toHaveBeenCalledWith('rolesMenuOpen', record)
    })
  })

  describe('render()', () => {
    describe('when rendering card', () => {
      it('should render the correct icon', () => {
        record.type = ITEM_TYPES.TEXT
        render()
        expect(wrapper.find(TextIconXs).exists()).toBe(true)

        record.type = ITEM_TYPES.VIDEO
        render()
        expect(wrapper.find(VideoIcon).exists()).toBe(true)
      })

      it('should render the collectionTypeSelector if collection', () => {
        record.allowsCollectionTypeSelector = true
        render()
        expect(wrapper.find(CollectionTypeSelector).exists()).toBe(true)
      })
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
