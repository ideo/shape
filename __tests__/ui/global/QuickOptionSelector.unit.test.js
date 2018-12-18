import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import XIcon from '~/ui/icons/XIcon'

let options = []
let props = {}
let rerender
const fakeEv = { preventDefault: jest.fn() }

let wrapper
function selectOption(idx) {
  return wrapper.find('QuickOption').at(idx)
}

describe('QuickOptionSelector', () => {
  beforeEach(() => {
    options = [
      {
        title: 'remove',
        icon: <XIcon />,
      },
      {
        title: 'an image',
        imageUrl: 'http://animage.jpg',
      },
      {
        title: 'a great image',
        imageUrl: 'http://angreatimage.jpg',
      },
      {
        title: 'bg',
        color: '#123456',
      },
    ]
    props = {
      options,
      onSelect: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<QuickOptionSelector {...props} />)
    }
    rerender()
  })

  describe('render()', () => {
    describe('when it has an icon', () => {
      it('should wrap the icon in the svg', () => {
        const option = selectOption(0)
        expect(option.find(XIcon).exists()).toBe(true)
      })
    })

    describe('when it has an image', () => {
      it('should render with the image as the background', () => {
        const option = selectOption(1)
        expect(option).toHaveStyleRule(
          'background-image',
          `url(${props.options[1].imageUrl})`
        )
      })
    })

    describe('when it has a color', () => {
      it('should make the background color the color', () => {
        const option = selectOption(3)
        expect(option).toHaveStyleRule(
          'background-color',
          props.options[3].color
        )
      })
    })
  })

  describe('toggle()', () => {
    beforeEach(() => {
      wrapper
        .find('button')
        .first()
        .simulate('click', fakeEv)
    })

    it('should call the onSelect prop', () => {
      expect(props.onSelect).toHaveBeenCalled()
    })
  })
})
