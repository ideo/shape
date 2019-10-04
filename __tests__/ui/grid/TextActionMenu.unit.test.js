import _ from 'lodash'
import TextActionMenu from '~/ui/grid/TextActionMenu'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollectionCard } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

const props = {
  card: fakeCollectionCard,
  offsetPosition: { x: 0, y: 0 }, // Not sure we need to test this
  uiStore: fakeUiStore,
}
let wrapper, actions

describe('TextActionMenu', () => {
  describe('as viewer', () => {
    beforeEach(() => {
      actions = ['Comment']
      wrapper = shallow(<TextActionMenu.wrappedComponent {...props} canEdit />)
    })

    it('render snapshot', () => {
      expectTreeToMatchSnapshot(wrapper)
    })

    it('creates a PopoutMenu with a comment action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
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
