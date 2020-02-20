import BottomLeftCardIcons from '~/ui/grid/BottomLeftCardIcons'
import { fakeCollectionCard, fakeCollection, fakeTextItem } from '#/mocks/data'
const props = {
  card: fakeCollectionCard,
  record: fakeCollection,
  cardType: 'collections',
}
let wrapper, rerender

describe('BottomLeftCardIcons', () => {
  beforeEach(() => {
    rerender = function() {
      wrapper = shallow(<BottomLeftCardIcons {...props} />)
      return wrapper
    }
  })

  describe('as link card', () => {
    beforeEach(() => {
      props.card.link = true
      rerender()
    })

    it('renders a link icon', () => {
      expect(wrapper.find('LinkedCollectionIcon').exists()).toBe(true)
    })
  })

  describe('as hidden card', () => {
    beforeEach(() => {
      props.card.record = { ...fakeTextItem, is_private: true }
      props.record = props.card.record
      props.cardType = 'items'
      rerender()
    })

    it('renders a link icon for hidden card', () => {
      expect(wrapper.find('HiddenIconButton').exists()).toBe(true)
    })
  })
})
