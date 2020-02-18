import _ from 'lodash'
import TextActionMenu from '~/ui/grid/TextActionMenu'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeApiStore from '#/mocks/fakeApiStore'
import { fakeCollectionCard } from '#/mocks/data'

const props = {
  card: fakeCollectionCard,
  offsetPosition: { x: 0, y: 0 }, // Not sure we need to test this
  uiStore: fakeUiStore,
  apiStore: fakeApiStore(),
}
let wrapper, actions, component

describe('TextActionMenu', () => {
  describe('as viewer', () => {
    beforeEach(() => {
      actions = ['Comment']
      wrapper = shallow(<TextActionMenu.wrappedComponent {...props} canEdit />)
      component = wrapper.instance()
    })

    it('creates a PopoutMenu with a comment action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })

    it('calls addComment on comment action', () => {
      component.addComment()
      expect(
        component.props.apiStore.openCurrentThreadToCommentOn
      ).toHaveBeenCalled()
      expect(component.props.uiStore.closeCardMenu).toHaveBeenCalled()
    })
  })

  describe('as editor', () => {
    beforeEach(() => {
      actions = ['Comment']
      wrapper = shallow(<TextActionMenu.wrappedComponent {...props} canEdit />)
    })

    it('creates a PopoutMenu with a comment action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })
})
