import HiddenIconButton from '~/ui/icons/HiddenIconButton'
import { uiStore } from '~/stores'
import { fakeTextItem } from '#/mocks/data'

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
      expect(wrapper.find('button').exists()).toBeTruthy()
      expect(wrapper.find('Tooltip').exists()).toBeTruthy()
    })

    describe('not clickable', () => {
      it('should not trigger the uiStore confirm dialog', () => {
        wrapper.find('button').simulate('click')
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
        wrapper.find('button').simulate('click')
        expect(uiStore.confirm).toHaveBeenCalled()
      })
    })
  })
})
