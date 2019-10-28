import CommentThumbnail from '~/ui/threads/CommentThumbnail'
import { ITEM_TYPES } from '~/utils/variables'
import { routingStore } from '~/stores'
import { fakeCollection, fakeThread } from '#/mocks/data'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'
const props = {
  threadRecord: fakeThread.record,
  subjectRecord: fakeCollection,
  useSubjectIcon: false,
}

jest.mock('../../../app/javascript/stores')

let wrapper, rerender

describe('CommentThumbnail', () => {
  beforeEach(() => {
    rerender = function() {
      wrapper = shallow(<CommentThumbnail {...props} />)
      return wrapper
    }
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  describe('with a collection record', () => {
    beforeEach(() => {
      rerender()
    })
    it('should render a ThumbnailHolder', () => {
      expect(wrapper.find('ThumbnailHolder').exists()).toBeTruthy()
    })
    describe('with a collection with a cover image', () => {
      const subjectRecord = {
        id: 5,
        internalType: 'collections',
        cover: {},
      }
      const threadRecord = {
        id: 3,
        internalType: 'collections',
        cover: {},
      }
      beforeEach(() => {
        props.subjectRecord = subjectRecord
        props.threadRecord = threadRecord
        rerender()
      })

      it('should be a link to the collection', () => {
        expect(routingStore.pathTo).toHaveBeenCalledWith('collections', 3)
      })

      it('should render the CollectionIcon', () => {
        expect(
          wrapper.find('ThumbnailHolder CollectionIcon').exists()
        ).toBeTruthy()
      })

      describe('with a collection with a cover image', () => {
        beforeEach(() => {
          props.subjectRecord = {
            ...subjectRecord,
            cover: { image_url: 'hello' },
          }
          rerender()
        })

        it('should render the filestack file url', () => {
          expect(wrapper.find('ThumbnailHolder img').props().src).toEqual(
            'hello'
          )
        })
      })
    })
  })

  describe('with a item record', () => {
    const itemRecord = {
      id: 2,
      internalType: 'items',
      filestack_file_url: 'http://url',
    }

    beforeEach(() => {
      props.subjectRecord = itemRecord
      rerender()
    })

    it('should be a link to the item', () => {
      // FIXME: props are different
      // expect(routingStore.pathTo).toHaveBeenCalledWith('items', 2)
    })

    it('should render the filestack file url', () => {
      expect(wrapper.find('img').props().src).toEqual('http://url')
    })

    describe('with a text item', () => {
      beforeEach(() => {
        props.subjectRecord = { ...itemRecord, type: ITEM_TYPES.TEXT }
        rerender()
      })

      it('should render the TextIcon', () => {
        expect(wrapper.find('ThumbnailHolder TextIcon').exists()).toBeTruthy()
      })
    })
  })
})
