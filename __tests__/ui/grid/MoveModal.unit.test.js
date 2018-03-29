import MoveModal from '~/ui/grid/MoveModal'
import {
  fakeCollection,
  fakeUser
} from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'


describe('MoveModal', () => {
  let props
  let wrapper
  let component

  beforeEach(() => {
    props = {
      apiStore: fakeApiStore({
        requestResult: { data: fakeCollection }
      }),
      uiStore: {
        closeMoveMenu: jest.fn(),
        deselectCards: jest.fn(),
        viewingCollection: fakeCollection,
        movingFromCollectionId: null,
        movingCardIds: [],
      }
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
          userCanEdit: jest.fn().mockReturnValue(true)
        }
      })

      it('should not make an API request', () => {
        expect(props.apiStore.request).not.toHaveBeenCalled()
      })

      it('should show a warning', () => {
        // Unimplemented
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
          userCanEdit: jest.fn().mockReturnValue(true),
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
        expect(props.uiStore.deselectCards).toHaveBeenCalled()
      })
    })
  })
})
