import _ from 'lodash'
import TextActionMenu from '~/ui/grid/TextActionMenu'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollectionCard, fakeThread } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

const props = {
  card: fakeCollectionCard,
  offsetPosition: { x: 0, y: 0 }, // Not sure we need to test this
  uiStore: fakeUiStore,
}
let wrapper, actions, component

describe('TextActionMenu', () => {
  describe('as viewer', () => {
    beforeEach(() => {
      actions = ['Comment']
      wrapper = shallow(<TextActionMenu.wrappedComponent {...props} canEdit />)
      component = wrapper.instance()
    })

    it('render snapshot', () => {
      expectTreeToMatchSnapshot(wrapper)
    })

    it('creates a PopoutMenu with a comment action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })

    it('calls addComment on comment action', () => {
      component.addComment()
      expect(fakeThread.API_saveComment).toHaveBeenCalled()
      // ...
      // Should this simulate click on comment
      // And test if component.addComment is called?
      // I guess that's more so re-testing what is already in PopoutMenu test
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
