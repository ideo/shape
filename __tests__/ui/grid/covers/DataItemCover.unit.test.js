import DataItemCover from '~/ui/grid/covers/DataItemCover'
import {
  fakeDataset,
  fakeDataItemCollectionsItemsAttrs,
  fakeDataItemRecordAttrs,
} from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

const props = {}
let wrapper, render
const apiStore = fakeApiStore()
describe('DataItemCover', () => {
  beforeEach(() => {
    props.apiStore = apiStore
    props.item = fakeDataItemCollectionsItemsAttrs
    props.item.primaryDataset = fakeDataset
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    render = () =>
      (wrapper = shallow(<DataItemCover.wrappedComponent {...props} />))
    render()
  })

  describe('item with "report_type_collections_and_items"', () => {
    beforeEach(() => {
      props.item = fakeDataItemCollectionsItemsAttrs
      props.item.primaryDataset = fakeDataset
      props.card.record = props.item
      wrapper.setProps(props)
      render()
    })

    it('renders DataItemCoverCollectionsItems', () => {
      expect(wrapper.find('DataItemCoverCollectionsItems').exists()).toBe(true)
      expect(wrapper.find('DataItemCoverDisplayOnly').exists()).toBe(false)
    })
  })

  describe('item with "report_type_record"', () => {
    beforeEach(() => {
      props.item = fakeDataItemRecordAttrs
      props.item.primaryDataset = fakeDataset
      props.card.record = props.item
      wrapper.setProps(props)
      render()
    })

    it('renders DataItemCoverCollectionsItems', () => {
      expect(wrapper.find('DataItemCoverDisplayOnly').exists()).toBe(true)
      expect(wrapper.find('DataItemCoverCollectionsItems').exists()).toBe(false)
    })
  })
})
