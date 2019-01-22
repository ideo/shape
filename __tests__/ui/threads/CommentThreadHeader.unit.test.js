import CommentThreadHeader, {
  FollowHolder,
} from '~/ui/threads/CommentThreadHeader'
import { fakeThread } from '#/mocks/data'
import v, { ITEM_TYPES } from '~/utils/variables'
import { routingStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let wrapper, props
const fakeEv = { preventDefault: jest.fn() }

describe('CommentThreadHeader', () => {
  describe('with a thread', () => {
    beforeEach(() => {
      props = {
        thread: fakeThread,
      }
      wrapper = shallow(<CommentThreadHeader {...props} />)
    })

    describe('with unreadCount', () => {
      beforeEach(() => {
        props = {
          thread: { ...fakeThread, unreadCount: 2 },
        }
        wrapper = shallow(<CommentThreadHeader {...props} />)
      })
      it('should render the unreadCount', () => {
        expect(wrapper.find('.unread.show-unread').exists()).toBeTruthy()
        expect(wrapper.find('CommentIcon').exists()).toBeTruthy()
      })
    })

    describe('with no unreadCount', () => {
      beforeEach(() => {
        props = {
          thread: { ...fakeThread, unreadCount: 0 },
        }
        wrapper = shallow(<CommentThreadHeader {...props} />)
      })
      it('should not render the unreadCount', () => {
        expect(wrapper.find('.unread.show-unread').exists()).toBeFalsy()
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
            expect(
              wrapper.find('ThumbnailHolder TextIcon').exists()
            ).toBeTruthy()
          })
        })
      })
    })
  })

  describe('with a record', () => {
    beforeEach(() => {
      props = {
        record: fakeThread.record,
      }
      wrapper = shallow(<CommentThreadHeader {...props} />)
    })

    it('should render the StyledHeader', () => {
      expect(wrapper.find('StyledHeader').exists()).toBeTruthy()
    })

    it('should not render the timestamp or unreadCount', () => {
      expect(wrapper.find('Moment').exists()).toBeFalsy()
      expect(wrapper.find('CommentIcon').exists()).toBeFalsy()
    })
  })

  describe('subscriptions', () => {
    let button
    beforeEach(() => {
      props = {
        thread: fakeThread,
      }
      wrapper = shallow(<CommentThreadHeader {...props} />)
      button = wrapper
        .find(FollowHolder)
        .find('button')
        .first()
    })

    describe('when subscribed', () => {
      beforeEach(() => {
        props.thread.users_thread.subscribed = true
        wrapper = shallow(<CommentThreadHeader {...props} />)
      })

      it('should render the follow icon in dark color', () => {
        const holder = wrapper.find(FollowHolder)
        expect(holder).toHaveStyleRule('color', v.colors.commonLight)
      })

      it('should call API_unsubscribe when clicking', () => {
        button.simulate('click', fakeEv)
        expect(props.thread.API_unsubscribe).toHaveBeenCalled()
      })
    })

    describe('when unsubscribed', () => {
      beforeEach(() => {
        props = {
          thread: fakeThread,
        }
        props.thread.users_thread.subscribed = false
        wrapper = shallow(<CommentThreadHeader {...props} />)
      })

      it('should render the follow icon in dark color', () => {
        const holder = wrapper.find(FollowHolder)
        expect(holder).toHaveStyleRule('color', v.colors.secondaryLight)
      })

      it('should call API_subscribe when clicking', () => {
        button.simulate('click', fakeEv)
        expect(props.thread.API_subscribe).toHaveBeenCalled()
      })
    })
  })
})
