import CoverRenderer from '~/ui/grid/CoverRenderer'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import {
  fakeCollectionCard,
  fakeItemCard,
  fakeCollection,
  fakeTextItem,
  fakeFileItem,
} from '#/mocks/data'

let wrapper, rerender, props

describe('CoverRenderer', () => {
  beforeEach(() => {
    props = {}
    props.card = fakeItemCard
    props.cardType = 'items'
    props.record = fakeTextItem
    props.height = 1
    rerender = function() {
      wrapper = shallow(<CoverRenderer {...props} />)
      return wrapper
    }
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  describe('with collection', () => {
    beforeEach(() => {
      props.card = fakeCollectionCard
      props.cardType = 'collections'
      props.canEditCollection = false
      props.record = fakeCollection
      props.record.can_edit = false
      rerender()
    })

    it('renders the collection cover', () => {
      expect(wrapper.find('CollectionCover').props().collection).toEqual(
        fakeCollection
      )
    })
  })

  describe('with a pdf file', () => {
    beforeEach(() => {
      props.card.record = { ...fakeFileItem }
      props.record = props.card.record
      props.record.isPdfFile = true
      props.cardType = 'items'
      rerender()
    })

    it('renders a generic file cover', () => {
      expect(wrapper.find('PdfFileItemCover').exists()).toBeTruthy()
    })
  })

  describe('with a generic file', () => {
    beforeEach(() => {
      props.card.record = { ...fakeFileItem }
      props.record = props.card.record
      props.record.isGenericFile = true
      props.cardType = 'items'
      rerender()
    })

    it('renders a generic file cover', () => {
      expect(wrapper.find('GenericFileItemCover').exists()).toBeTruthy()
    })
  })
})
