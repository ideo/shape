import CommentThreadHeader, {
  FollowHolder,
} from '~/ui/threads/CommentThreadHeader'

import { fakeThread } from '#/mocks/data'
import { ITEM_TYPES } from '~/utils/variables'
import { routingStore, uiStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let wrapper, props

const fakeEv = { preventDefault: jest.fn(), stopPropagation: jest.fn() }

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
        .find('span[role="button"]')
        .first()
    })

    describe('when subscribed', () => {
      beforeEach(() => {
        props.thread.users_thread.subscribed = true
        wrapper = shallow(<CommentThreadHeader {...props} />)
      })

      it('should render the follow icon in dark color', () => {
        const holder = wrapper.find(FollowHolder)
        expect(holder.props().isFollowed).toBe(true)
      })

      it('should call API_unsubscribe when clicking', () => {
        button.simulate('click', fakeEv)
        expect(props.thread.API_unsubscribe).toHaveBeenCalled()
      })

      it('should set user_thread subscribed to false when clicking', () => {
        button.simulate('click', fakeEv)
        expect(props.thread.users_thread.subscribed).toBe(false)
      })

      it('should show an alert when clicking', () => {
        button.simulate('click', fakeEv)
        expect(uiStore.popupAlert).toHaveBeenCalled()
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
        expect(holder.props().isFollowed).toBe(false)
      })

      it('should call API_subscribe when clicking', () => {
        button.simulate('click', fakeEv)
        expect(props.thread.API_subscribe).toHaveBeenCalled()
      })

      it('should set user_thread subscribed to true when clicking', () => {
        button.simulate('click', fakeEv)
        expect(props.thread.users_thread.subscribed).toBe(true)
      })
    })

    describe('componentDidMount when on the unsubscribe route opt', () => {
      beforeEach(() => {
        props.thread.users_thread.subscribed = true
        routingStore.query = { unsubscribe: true }
        wrapper = shallow(<CommentThreadHeader {...props} />)
      })

      it('should set a local property to keep the unsubscribed state in ui', () => {
        expect(props.thread.users_thread.unsubscribedFromEmail).toBe(false)
      })
    })
  })
})
