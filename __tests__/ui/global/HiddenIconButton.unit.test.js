import HiddenIconButton from '~/ui/global/HiddenIconButton'
import { uiStore } from '~/stores'
import { fakeTextItem } from '#/mocks/data'

import Tooltip from '~/ui/global/Tooltip'

jest.mock('../../../app/javascript/stores/index')

describe('HiddenIconButton', () => {
  let wrapper, props
  beforeEach(() => {
    props = {
      clickable: false,
      record: { ...fakeTextItem, can_edit: true },
    }
    wrapper = shallow(<HiddenIconButton {...props} />)
  })

  describe('render', () => {
    it('should render a button with a Tooltip', () => {
      expect(wrapper.find('StyledHiddenIconButton').exists()).toBeTruthy()
      expect(wrapper.find(Tooltip).exists()).toBeTruthy()
    })

    describe('not clickable', () => {
      it('should not trigger the uiStore confirm dialog', () => {
        wrapper.find('StyledHiddenIconButton').simulate('click')
        expect(uiStore.confirm).not.toHaveBeenCalled()
      })
    })

    describe('clickable', () => {
      beforeEach(() => {
        const newProps = {
          ...props,
          clickable: true,
        }
        wrapper = shallow(<HiddenIconButton {...newProps} />)
      })

      it('should trigger the uiStore confirm dialog', () => {
        wrapper.find('StyledHiddenIconButton').simulate('click')
        expect(uiStore.confirm).toHaveBeenCalled()
      })
    })
  })
})
