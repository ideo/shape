import FontColorSelector from '~/ui/global/FontColorSelector'
import ColorPickerIcon from '~/ui/icons/ColorPickerIcon'
import XIcon from '~/ui/icons/XIcon'

let props = {}
let wrapper, rerender, options

describe('FontColorSelector', () => {
  beforeEach(() => {
    options = [
      {
        type: 'remove',
        title: 'reset font color',
        icon: <XIcon />,
      },
      {
        type: 'color',
        title: 'font color',
        icon: <ColorPickerIcon />,
      },
    ]
    props = {
      defaultFontColor: '#123123',
      onSelect: jest.fn(),
    }
    rerender = () => {
      // NOTE: in latest version of jest-styled-components, mount must be used
      // if you want to test `toHaveStyleRule` of anything on `wrapper.find(...)`
      wrapper = shallow(<FontColorSelector {...props} />)
    }
    rerender()
  })

  it('should render a ColorPicker when it is open', () => {
    const optSelector = wrapper.find('QuickOptionSelector')
    optSelector.props().onSelect({ type: 'color' })
    expect(wrapper.find('ColorPicker').exists()).toBe(true)
  })

  it('should not render the propagate checkbox if onTogglePropagate is null', () => {
    expect(wrapper.find('CheckboxWithLabel').exists()).toBe(false)
  })

  describe('with no selected font color', () => {
    it('should render a QuickOptionSelector, passing in 2 default options', () => {
      const optSelector = wrapper.find('QuickOptionSelector')
      expect(optSelector.exists()).toBe(true)
      expect(optSelector.props().options).toEqual(options)
    })
  })

  describe('with a selected font color', () => {
    beforeEach(() => {
      props.fontColor = '#000bbb'
      options = [
        options[0],
        {
          type: 'color',
          title: 'current color',
          color: props.fontColor,
        },
        options[1],
      ]
      rerender()
    })

    it('should render a QuickOptionSelector, passing in 3 options', () => {
      const optSelector = wrapper.find('QuickOptionSelector')
      expect(optSelector.props().options).toEqual(options)
    })
  })

  describe('with onTogglePropagate option', () => {
    beforeEach(() => {
      props.onTogglePropagate = jest.fn()
      props.propagate = true
      rerender()
    })

    it('should render CheckboxWithLabel', () => {
      const checkbox = wrapper.find('CheckboxWithLabel')
      expect(checkbox.props().checked).toEqual(props.propagate)
      expect(checkbox.props().label).toEqual('Apply to all nested collections')
    })
  })
})
