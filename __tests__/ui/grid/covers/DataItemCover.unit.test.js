import DataItemCover from '~/ui/grid/covers/DataItemCover'
import {
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
    props.card = { id: 1, record: props.item, width: 1, height: 1 }
    render = () =>
      (wrapper = shallow(<DataItemCover.wrappedComponent {...props} />))
    render()
  })

  describe('with report type collections and items item', () => {
    beforeEach(() => {
      props.item = fakeDataItemCollectionsItemsAttrs
      props.card.record = props.item
      wrapper.setProps(props)
    })

    it('renders DataItemCoverCollectionsItems', () => {
      expect(wrapper.find('DataItemCoverCollectionsItems').exists()).toBe(true)
      expect(wrapper.find('DataItemCoverDisplayOnly').exists()).toBe(false)
    })
  })

  describe('with report type record item', () => {
    beforeEach(() => {
      props.item = fakeDataItemRecordAttrs
      props.card.record = props.item
      wrapper.setProps(props)
    })

    it('renders DataItemCoverCollectionsItems', () => {
      expect(wrapper.find('DataItemCoverDisplayOnly').exists()).toBe(true)
      expect(wrapper.find('DataItemCoverCollectionsItems').exists()).toBe(false)
    })
  })
})
