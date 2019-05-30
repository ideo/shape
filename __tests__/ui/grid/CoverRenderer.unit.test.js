import CoverRenderer from '~/ui/grid/CoverRenderer'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
import { uiStore } from '~/stores'
import {
  fakeCollectionCard,
  fakeItemCard,
  fakeCollection,
  fakeTextItem,
  fakeFileItem,
} from '#/mocks/data'

jest.mock('../../../app/javascript/stores/index')

let wrapper, rerender, props

const fakeEvent = {
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
}

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

  it('does not render link', () => {
    expect(wrapper.find('PlainLink').exists()).toEqual(false)
  })

  describe('with a cover item', () => {
    beforeEach(() => {
      props.isCoverItem = true
      rerender()
    })

    it('renders item wrapped in a link', () => {
      expect(wrapper.find('PlainLink').exists()).toEqual(true)
    })

    describe('handleClickToCollection', () => {
      describe('user can view', () => {
        beforeEach(() => {
          props.record.can_view = true
          rerender()
        })

        it('returns true', () => {
          expect(wrapper.instance().handleClickToCollection(fakeEvent)).toEqual(
            true
          )
        })

        it('does not call uiStore.showPermissionsAlert', () => {
          wrapper.instance().handleClickToCollection(fakeEvent)
          expect(uiStore.showPermissionsAlert).not.toHaveBeenCalled()
        })
      })

      describe('user cannot view', () => {
        beforeEach(() => {
          props.record.can_view = false
          rerender()
        })

        it('calls uiStore.showPermissionsAlert', () => {
          expect(wrapper.instance().handleClickToCollection(fakeEvent)).toEqual(
            false
          )
          expect(uiStore.showPermissionsAlert).toHaveBeenCalled()
        })
      })
    })
  })
})
