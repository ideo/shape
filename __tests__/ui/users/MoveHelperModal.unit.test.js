import MoveHelperModal from '~/ui/users/MoveHelperModal'
import { fakeUser } from '#/mocks/data'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeRoutingStore from '#/mocks/fakeRoutingStore'
import { useTemplateInMyCollection } from '~/utils/url'
import v from '~/utils/variables'

jest.mock('../../../app/javascript/utils/url')

let props, wrapper, component, uiStore, routingStore, rerender

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
      type: 'template',
      uiStore,
      routingStore,
      apiStore: fakeApiStore(),
    }
    rerender = () => {
      wrapper = shallow(<MoveHelperModal.wrappedComponent {...props} />)
      return wrapper
    }
    rerender()
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

      it("should update the current user's default template behavior setting to let the user place it using the MDL", () => {
        expect(
          props.apiStore.currentUser.API_updateUseTemplateSetting
        ).toHaveBeenCalledWith(v.useTemplateSettings.letMePlaceIt)
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

      it("should update the current user's default template behavior setting to add to my collection ", () => {
        expect(
          props.apiStore.currentUser.API_updateUseTemplateSetting
        ).toHaveBeenCalledWith(v.useTemplateSettings.addToMyCollection)
      })
    })
  })

  describe("with type === 'move'", () => {
    beforeEach(() => {
      props.type = 'move'
      rerender()
    })

    it('should render a Close button', () => {
      expect(wrapper.find('TextButton').text()).toEqual('Close')
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
