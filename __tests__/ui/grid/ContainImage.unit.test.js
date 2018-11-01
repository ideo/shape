import ContainImage from '~/ui/grid/ContainImage'
import { fakeCollectionCard } from '#/mocks/data'

const card = fakeCollectionCard
const props = {
  card,
}

const fakeEv = { preventDefault: jest.fn() }

let wrapper, component
describe('ContainImage', () => {
  beforeEach(() => {
    props.card.image_contain = false
    wrapper = shallow(<ContainImage {...props} />)
    component = wrapper.instance()
  })

  describe('render()', () => {
    describe('when image is already contained', () => {
      beforeEach(() => {
        props.card.image_contain = true
        wrapper.setProps(props)
      })

      it('should show the fill tile with image tooltip', () => {
        expect(wrapper.find('Tooltip').props().title).toEqual(
          'fill tile with image'
        )
      })
    })

    it('should show the show whole image tooltip', () => {
      expect(wrapper.find('Tooltip').props().title).toEqual('show whole image')
    })
  })

  describe('toggleSelected()', () => {
    beforeEach(() => {
      wrapper.find('ButtonWrapper').simulate('click', fakeEv)
    })

    it('should toggle the card image_contain property', () => {
      expect(card.image_contain).toBe(true)
      component.toggleSelected(fakeEv)
      expect(card.image_contain).toBe(false)
    })

    it('shoudl save the card', () => {
      expect(card.save).toHaveBeenCalled()
    })
  })
})
