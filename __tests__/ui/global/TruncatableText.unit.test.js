import TruncatableText from '~/ui/global/TruncatableText'
import { rightClamp } from '~/utils/textUtils'
import Tooltip from '~/ui/global/Tooltip'

let wrapper, props

describe('TruncatableText', () => {
  describe('with text greater than the max text to display', () => {
    beforeEach(() => {
      props = {
        text: 'My Collection',
        maxLength: 10,
      }

      wrapper = shallow(<TruncatableText {...props} />)
    })

    it('renders a truncated text with a Tooltip', () => {
      expect(
        wrapper
          .find('span')
          .children()
          .first()
          .text()
      ).toEqual(rightClamp(props.text, props.maxLength))

      expect(
        wrapper
          .find(Tooltip)
          .first()
          .props().title
      ).toMatch(props.text)
    })
  })

  describe('with text less than the max text to display', () => {
    beforeEach(() => {
      props = {
        text: 'My Collection',
        maxLength: 14,
      }

      wrapper = shallow(<TruncatableText {...props} />)
    })

    it('renders the full text', () => {
      expect(
        wrapper
          .find('span')
          .children()
          .first()
          .text()
      ).toEqual(props.text)

      expect(wrapper.find('Tooltip').exists()).toBeFalsy()
    })
  })
})
