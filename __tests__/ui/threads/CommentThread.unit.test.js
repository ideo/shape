import CommentThread from '~/ui/threads/CommentThread'
import { fakeThread } from '#/mocks/data'
import { ITEM_TYPES } from '~/utils/variables'
import { routingStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let wrapper, props

describe('CommentThread', () => {
  beforeEach(() => {
    props = {
      expanded: false,
      onClick: jest.fn(),
      afterSubmit: jest.fn(),
      thread: fakeThread,
    }
    wrapper = shallow(<CommentThread {...props} />)
  })

  it('renders a title with the record.name', () => {
    expect(wrapper.find('.name').text()).toContain(props.thread.record.name)
  })

  it('renders a CommentEntryForm', () => {
    // NOTE: textarea is just shown/hidden via "expanded" prop so it should always exist
    expect(wrapper.find('CommentEntryForm').exists()).toBeTruthy()
    expect(wrapper.find('CommentEntryForm').props().expanded).toEqual(
      props.expanded
    )
  })

  describe('with unexpanded thread', () => {
    it('renders unread comments if thread is unexpanded', () => {
      // fakeThread has 2 latestUnreadComments
      expect(wrapper.find('Comment').length).toEqual(
        props.thread.latestUnreadComments.length
      )
    })
  })

  describe('with expanded thread', () => {
    beforeEach(() => {
      props = {
        ...props,
        expanded: true,
      }
      wrapper = shallow(<CommentThread {...props} />)
    })

    it('renders all the comments if thread is expanded', () => {
      expect(wrapper.find('Comment').length).toEqual(
        props.thread.comments.length
      )
    })
  })

  describe('renderThumbnail', () => {
    function setThreadRecord(record) {
      const thread = {
        ...fakeThread,
        record,
      }
      props = {
        ...props,
        thread,
      }
      wrapper.setProps(props)
    }

    describe('with a collection', () => {
      const collectionRecord = {
        id: 5,
        internalType: 'collections',
        cover: {},
      }

      beforeEach(() => {
        setThreadRecord(collectionRecord)
      })

      it('should be a link to the collection', () => {
        expect(routingStore.pathTo).toHaveBeenCalledWith('collections', 5)
      })

      it('should render the collection icon', () => {
        expect(
          wrapper.find('ThumbnailHolder CollectionIcon').exists()
        ).toBeTruthy()
      })

      describe('with a collection with a cover image', () => {
        beforeEach(() => {
          setThreadRecord({
            ...collectionRecord,
            ...{ cover: { image_url: 'hello' } },
          })
        })

        it('should render the filestack file url', () => {
          expect(wrapper.find('ThumbnailHolder img').props().src).toEqual(
            'hello'
          )
        })
      })
    })

    describe('with an item', () => {
      const itemRecord = {
        id: 2,
        internalType: 'items',
        filestack_file_url: 'http://url',
      }

      beforeEach(() => {
        setThreadRecord(itemRecord)
      })

      it('should be a link to the item', () => {
        expect(routingStore.pathTo).toHaveBeenCalledWith('items', 2)
      })

      it('should render the filestack file url', () => {
        expect(wrapper.find('ThumbnailHolder img').props().src).toEqual(
          'http://url'
        )
      })

      describe('with a text item', () => {
        beforeEach(() => {
          setThreadRecord({ ...itemRecord, type: ITEM_TYPES.TEXT })
        })

        it('should render the TextIcon', () => {
          expect(wrapper.find('ThumbnailHolder TextIcon').exists()).toBeTruthy()
        })
      })
    })
  })
})
