import CardActionHolder from '~/ui/icons/CardActionHolder'
import CoverImageToggle from '~/ui/grid/CoverImageToggle'
import { fakeCollectionCard } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

const card = fakeCollectionCard
let props = {}
let rerender
const fakeEv = { preventDefault: jest.fn() }

let wrapper, component
describe('CoverImageToggle', () => {
  beforeEach(() => {
    props = {
      card,
      onReassign: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<CoverImageToggle {...props} />)
    }
    rerender()
    component = wrapper.instance()
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  describe('render()', () => {
    describe('when image is not the cover', () => {
      beforeEach(() => {
        props.card.is_cover = false
        wrapper.setProps(props)
      })

      it('should set active to false', () => {
        const ele = wrapper.find(CardActionHolder)
        expect(ele.props().active).toBe(false)
      })
    })

    describe('when image is the cover', () => {
      beforeEach(() => {
        props.card.is_cover = true
        rerender()
      })

      it('should set active to true', () => {
        const ele = wrapper.find(CardActionHolder)
        expect(ele.props().active).toBe(true)
      })
    })
  })

  describe('toggle()', () => {
    beforeEach(() => {
      wrapper.find(CardActionHolder).simulate('click', fakeEv)
    })

    it('should toggle the card is_cover property', () => {
      expect(card.is_cover).toBe(false)
      component.toggle(fakeEv)
      expect(card.is_cover).toBe(true)
    })

    it('should save the card', () => {
      expect(card.save).toHaveBeenCalled()
    })

    it('should call the onReassign prop', () => {
      expect(props.onReassign).toHaveBeenCalled()
    })
  })
})
