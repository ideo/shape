import PageWithApiWrapper from '~/ui/pages/PageWithApiWrapper'
import Deactivated from '~/ui/layout/Deactivated'
import { apiStore, uiStore, routingStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let wrapper, location, match, props, instance, rerender
let fakeCollection
beforeEach(() => {
  location = {}
  match = {
    path: '/collections/:id',
    url: '/collections',
    params: {
      id: 1,
      org: 'ideo',
    },
  }
  apiStore.currentOrgSlug = 'ideo'
  props = {
    location,
    match,
    apiStore,
    uiStore,
    routingStore,
    fetchType: 'collections',
    render: () => null,
  }

  fakeCollection = { id: '123', updateFullyLoaded: jest.fn() }
  apiStore.request = jest
    .fn()
    .mockReturnValue(Promise.resolve({ data: fakeCollection }))

  rerender = () => {
    wrapper = shallow(<PageWithApiWrapper.wrappedComponent {...props} />)
    instance = wrapper.instance()
  }
  rerender()
})

describe('PageWithApiWrapper', () => {
  it('clears some of the uiStore state on mount', () => {
    expect(uiStore.resetSelectionAndBCT).toHaveBeenCalled()
    expect(uiStore.clearTextEditingItem).toHaveBeenCalled()
  })

  describe('componentDidUpdate', () => {
    describe('requiresFetch', () => {
      beforeEach(() => {
        instance.fetchData = jest.fn()
      })

      describe('when the route match.url has changed', () => {
        beforeEach(() => {
          instance.componentDidUpdate({
            location,
            match: { ...match, url: 'different-slug' },
          })
        })

        it('calls fetchData', () => {
          expect(instance.fetchData).toHaveBeenCalled()
        })
      })
      describe('when the route match.url has not changed', () => {
        beforeEach(() => {
          instance.componentDidUpdate(props)
        })

        it('calls fetchData', () => {
          expect(instance.fetchData).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('fetchData', () => {
    beforeEach(() => {
      instance.fetchData()
    })

    it('calls apiStore request with page_view=true', () => {
      expect(apiStore.request).toHaveBeenCalledWith(
        `${props.fetchType}/${match.params.id}?page_view=true`
      )
    })

    it('calls record.updateFullyLoaded', () => {
      expect(fakeCollection.updateFullyLoaded).toHaveBeenCalledWith(true)
    })

    it('calls uiStore.setBodyBackgroundImage', () => {
      expect(uiStore.setBodyBackgroundImage).toHaveBeenCalledWith(
        fakeCollection.backgroundImageUrl
      )
    })

    it('calls uiStore.setBodyFontColor', () => {
      expect(uiStore.setBodyFontColor).toHaveBeenCalledWith(
        fakeCollection.fontColor
      )
    })
  })

  describe('afterFetchData', () => {
    let requestPath
    const otherRecord = { id: '456' }
    beforeEach(() => {
      requestPath = `${props.fetchType}/${match.params.id}?page_view=true`
      instance.setRecord(otherRecord)
    })

    it('sets the record', () => {
      // because this matches, it will set the record
      expect(instance.pathRequested).toEqual(requestPath)
      instance.afterFetchData({ data: fakeCollection }, requestPath)
      expect(instance.record).toEqual(fakeCollection)
    })

    it('does not set the record if pathRequested does not match', () => {
      requestPath = `some/other/path`
      // this does not match, so it will not set the record
      expect(instance.pathRequested).not.toEqual(requestPath)
      instance.afterFetchData({ data: fakeCollection }, requestPath)
      expect(instance.record).toEqual(otherRecord)
    })
  })

  describe('render', () => {
    const FakeComponent = () => <div />
    beforeEach(() => {
      wrapper = shallow(
        <PageWithApiWrapper.wrappedComponent
          {...props}
          render={collection => <FakeComponent collection={collection} />}
        />
      )
    })

    it('passes data to its rendered component', () => {
      expect(wrapper.find('FakeComponent').exists()).toBeTruthy()
      expect(wrapper.find('FakeComponent').props().collection).toEqual(
        fakeCollection
      )
    })

    describe('organization is deactivated and you get a 404 as a result', () => {
      beforeEach(() => {
        wrapper.setProps({
          apiStore: {
            ...apiStore,
            currentOrgIsDeactivated: true,
          },
          uiStore: {
            ...uiStore,
            pageError: { status: 404 },
          },
        })
      })

      it('renders the Deactivated component', () => {
        expect(wrapper.equals(<Deactivated />)).toEqual(true)
      })
    })
  })
})
