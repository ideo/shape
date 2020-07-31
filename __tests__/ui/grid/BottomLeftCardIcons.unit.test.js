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
    }
  })

  describe('as a collection', () => {
    beforeEach(() => {
      rerender()
    })

    it('renders a collection icon', () => {
      expect(wrapper.find('CollectionIcon').exists()).toBe(true)
    })
  })

  describe('as a foamcore board collection (big board)', () => {
    beforeEach(() => {
      props.record.isBigBoard = true
      rerender()
    })
    afterEach(() => {
      props.record.isBigBoard = false
    })

    it('renders a foamcore board icon', () => {
      expect(wrapper.find('CollectionIcon').exists()).toBe(false)
      expect(wrapper.find('FoamcoreBoardIcon').exists()).toBe(true)
    })
  })

  describe('as a CreativeDifferenceChartCover', () => {
    beforeEach(() => {
      props.record.isCreativeDifferenceChartCover = true
      rerender()
    })
    afterEach(() => {
      props.record.isCreativeDifferenceChartCover = false
    })

    it('does not render a collection icon', () => {
      expect(wrapper.find('CollectionIcon').exists()).toBe(false)
    })
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
