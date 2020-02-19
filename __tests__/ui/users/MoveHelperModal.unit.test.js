import MoveHelperModal from '~/ui/users/MoveHelperModal'
import { fakeUser } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { useTemplateInMyCollection } from '~/utils/url'

jest.mock('../../../app/javascript/utils/url')

let props, wrapper, component, uiStore, routingStore

describe('MoveHelperModal', () => {
  beforeEach(() => {
    uiStore = fakeUiStore
    uiStore.openMoveMenu.mockClear()
    uiStore.update.mockClear()
    uiStore.showTemplateHelperForCollection = {
      id: '99',
      name: 'some template',
    }
    routingStore = fakeRoutingStore
    fakeUser.show_move_helper = true
    props = {
      currentUser: fakeUser,
      type: 'move',
      uiStore,
      routingStore,
      apiStore: fakeApiStore(),
    }
    wrapper = shallow(<MoveHelperModal.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('letMePlaceIt', () => {
    const fakeEvent = {
      preventDefault: jest.fn(),
    }

    beforeEach(() => {
      component.letMePlaceIt(fakeEvent)
    })

    it('should set dismissedMoveHelper to true', () => {
      expect(uiStore.update).toHaveBeenCalledWith('dismissedMoveHelper', true)
    })

    it('should call openMoveMenu', () => {
      expect(uiStore.openMoveMenu).toHaveBeenCalledWith({
        from: uiStore.showTemplateHelperForCollection,
        cardAction: 'useTemplate',
      })
    })

    describe('after checking the dont show again box', () => {
      beforeEach(() => {
        component.dontShowChecked = true
        component.letMePlaceIt(fakeEvent)
      })

      it('should update the current user', () => {
        expect(props.apiStore.currentUser.API_hideHelper).toHaveBeenCalledWith(
          'move'
        )
      })
    })
  })

  describe('handleAddToMyCollection', () => {
    const fakeEvent = {
      preventDefault: jest.fn(),
    }

    beforeEach(() => {
      component.handleAddToMyCollection(fakeEvent)
    })

    it('should call useTemplateInMyCollection', () => {
      expect(useTemplateInMyCollection).toHaveBeenCalledWith(
        component.templateCollection.id
      )
    })

    describe('after checking the dont show again box', () => {
      beforeEach(() => {
        component.dontShowChecked = true
        component.handleAddToMyCollection(fakeEvent)
      })

      it('should update the current user', () => {
        expect(props.apiStore.currentUser.API_hideHelper).toHaveBeenCalledWith(
          'move'
        )
      })
    })
  })

  describe('render', () => {
    describe('with currentUser.show_template_helper = false', () => {
      beforeEach(() => {
        props.apiStore.currentUser.show_template_helper = false
        wrapper.update()
      })

      it('should not render the Buttons', () => {
        const modal = wrapper.find('Button')
        expect(modal.length).toBe(0)
      })
    })
  })
})
