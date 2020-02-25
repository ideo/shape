import DataItemCover from '~/ui/grid/covers/DataItemCover'
import {
  fakeDataset,
  fakeDataItemCollectionsItemsAttrs,
  fakeDataItemRecordAttrs,
} from '#/mocks/data'
import fakeApiStore from '#/mocks/fakeApiStore'

const props = {}
let wrapper, component
const fakeCollection = { id: 123 }
// requestResult is for loadTargetCollection
const apiStore = fakeApiStore({ requestResult: { data: fakeCollection } })

const render = () => {
  wrapper = shallow(<DataItemCover.wrappedComponent {...props} />)
  component = wrapper.instance()
}
describe('DataItemCover', () => {
  beforeEach(() => {
    props.apiStore = apiStore
    props.item = fakeDataItemCollectionsItemsAttrs
    props.item.primaryDataset = fakeDataset
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    render()
  })

  describe('item with "report_type_collections_and_items"', () => {
    beforeEach(() => {
      props.item = fakeDataItemCollectionsItemsAttrs
      props.item.primaryDataset = fakeDataset
      props.card.record = props.item
      render()
    })

    it('renders DataItemCoverCollectionsItems', () => {
      expect(wrapper.find('DataItemCoverCollectionsItems').exists()).toBe(true)
      expect(wrapper.find('DataItemCoverDisplayOnly').exists()).toBe(false)
    })

    describe('with data_source_id', () => {
      describe('with item', () => {
        beforeEach(() => {
          props.item.primaryDataset = {
            ...fakeDataset,
            data_source_id: 123,
            data_source_type: 'Item',
          }
          render()
        })
        it('does not load datasource unless data_source_type is Collection', () => {
          expect(apiStore.fetch).not.toHaveBeenCalled()
          expect(component.targetCollection).toEqual(null)
        })
      })

      describe('with item', () => {
        beforeEach(() => {
          props.item.primaryDataset = {
            ...fakeDataset,
            data_source_id: 123,
            data_source_type: 'Collection',
          }
          render()
        })
        it('loads the datasource into targetCollection', () => {
          // first it tries to find
          expect(apiStore.find).toHaveBeenCalledWith('collections', 123)
          // then fetch
          expect(apiStore.fetch).toHaveBeenCalledWith('collections', 123)
          expect(component.targetCollection).toEqual(fakeCollection)
          const dataItem = wrapper.find('DataItemCoverCollectionsItems')
          expect(dataItem.props().targetCollection).toEqual(fakeCollection)
        })
      })
    })
  })

  describe('item with "report_type_record"', () => {
    beforeEach(() => {
      props.item = fakeDataItemRecordAttrs
      props.item.primaryDataset = fakeDataset
      props.card.record = props.item
      render()
    })

    it('renders DataItemCoverCollectionsItems', () => {
      expect(wrapper.find('DataItemCoverDisplayOnly').exists()).toBe(true)
      expect(wrapper.find('DataItemCoverCollectionsItems').exists()).toBe(false)
    })
  })
})
