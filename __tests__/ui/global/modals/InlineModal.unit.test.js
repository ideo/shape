import InlineModal from '~/ui/global/modals/InlineModal'
import TextButton from '~/ui/global/TextButton'
import Button from '~/ui/global/Button'

let props, wrapper
const rerender = () => {
  wrapper = shallow(<InlineModal {...props} />)
}
beforeEach(() => {
  props = {
    leftButton: <TextButton className="left-button" />,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    children: [<Button key="button" />],
    open: false,
  }
  rerender()
})

describe('InlineModal', () => {
  it('renders Popover', () => {
    expect(wrapper.find('WithStyles(ForwardRef(Popover))').props().open).toBe(
      false
    )
  })

  describe('if open is true', () => {
    beforeEach(() => {
      props.open = true
      rerender()
    })

    it('passes open to Popover', () => {
      expect(wrapper.find('WithStyles(ForwardRef(Popover))').props().open).toBe(
        true
      )
    })
  })

  it('renders children', () => {
    expect(wrapper.find('Button').exists()).toBe(true)
  })

  it('renders leftButton if given', () => {
    expect(wrapper.find('.left-button').exists()).toBe(true)
    props.leftButton = null
    rerender()
    expect(wrapper.find('.left-button').exists()).toBe(false)
  })

  it('calls onConfirm when OK is clicked', () => {
    const fakeEv = { preventDefault: jest.fn(), stopPropagation: jest.fn() }
    wrapper.find('.ok-button').simulate('click', fakeEv)
    expect(fakeEv.preventDefault).toHaveBeenCalled()
    expect(fakeEv.stopPropagation).toHaveBeenCalled()
    expect(props.onConfirm).toHaveBeenCalled()
    expect(props.onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when cancel is clicked', () => {
    const fakeEv = { preventDefault: jest.fn(), stopPropagation: jest.fn() }
    wrapper.find('.cancel-button').simulate('click', fakeEv)
    expect(fakeEv.preventDefault).toHaveBeenCalled()
    expect(fakeEv.stopPropagation).toHaveBeenCalled()
    expect(props.onCancel).toHaveBeenCalled()
    expect(props.onConfirm).not.toHaveBeenCalled()
  })
})
