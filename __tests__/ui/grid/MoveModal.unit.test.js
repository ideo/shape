import MoveModal from '~/ui/grid/MoveModal'
import {
  fakeCollection,
  fakeUser
} from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'

let props, wrapper, component
const uiStore = fakeUiStore
describe('MoveModal', () => {
  beforeEach(() => {
    props = {
      apiStore: fakeApiStore({
        requestResult: { data: fakeCollection }
      }),
      uiStore,
    }
    props.apiStore.request = jest.fn()
    wrapper = shallow(
      <MoveModal.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('handleClose', () => {
    const fakeEvent = {
      preventDefault: jest.fn(),
    }

    it('should close the move menu in the uiStore', () => {
      component.handleClose(fakeEvent)
      expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
    })
  })

  describe('moveCards', () => {
    describe('on an uneditable collection', () => {
      beforeEach(() => {
        props.uiStore.viewingCollection = {
          can_edit: false,
        }
        wrapper.setProps(props)
        component.moveCards('top')
      })

      it('should not make an API request', () => {
        expect(props.apiStore.request).not.toHaveBeenCalled()
      })

      it('should show a warning', () => {
        expect(uiStore.openAlertModal).toHaveBeenCalled()
      })
    })

    describe('on a nested collection', () => {
      beforeEach(() => {
        props.apiStore.request.mockReturnValue(Promise.reject())
        wrapper.setProps(props)
        component.moveCards('top')
      })

      it('should show an alert dialog', () => {
        expect(uiStore.openAlertModal).toHaveBeenCalled()
      })
    })

    describe('on an editable, different collection', () => {
      beforeEach(() => {
        props.apiStore.currentUser = fakeUser
        props.apiStore.request = jest.fn().mockReturnValue(Promise.resolve())
        props.uiStore.movingCardIds = [21, 23]
        props.uiStore.movingFromCollectionId = 3
        props.uiStore.viewingCollection = {
          id: 4,
          can_edit: true,
        }
        wrapper.setProps(props)
        component = wrapper.instance()
      })

      it('should request the api to move the cards', async () => {
        await component.moveCards('beginning')
        expect(props.apiStore.request).toHaveBeenCalledWith(
          '/collection_cards/move',
          'PATCH',
          {
            to_id: props.uiStore.viewingCollection.id,
            from_id: props.uiStore.movingFromCollectionId,
            collection_card_ids: props.uiStore.movingCardIds,
            placement: 'beginning',
          }
        )
      })

      it('should close the move menu', async () => {
        await component.moveCards('beginning')
        expect(props.uiStore.closeMoveMenu).toHaveBeenCalled()
      })

      it('should deselect the cards', async () => {
        await component.moveCards('beginning')
        expect(props.uiStore.resetSelectionAndBCT).toHaveBeenCalled()
      })
    })
  })
})
