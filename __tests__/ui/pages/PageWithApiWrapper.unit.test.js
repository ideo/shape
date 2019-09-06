import PageWithApiWrapper from '~/ui/pages/PageWithApiWrapper'
import Deactivated from '~/ui/layout/Deactivated'
import { apiStore, uiStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let wrapper, location, match, props, instance, rerender

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
    fetchType: 'collections',
    render: () => null,
  }

  rerender = () => {
    wrapper = shallow(<PageWithApiWrapper.wrappedComponent {...props} />)
    instance = wrapper.instance()
  }
  rerender()
})

describe('PageWithApiWrapper', () => {
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

    it('calls apiStore request', () => {
      expect(apiStore.request).toHaveBeenCalledWith(
        `${props.fetchType}/${match.params.id}`
      )
    })
  })

  describe('render', () => {
    const fakeCollection = { id: 123 }
    const FakeComponent = () => <div />
    const fakeApiStore = {
      ...apiStore,
      request: jest
        .fn()
        .mockReturnValue(Promise.resolve({ data: fakeCollection })),
    }
    beforeEach(() => {
      wrapper = shallow(
        <PageWithApiWrapper.wrappedComponent
          {...props}
          apiStore={fakeApiStore}
          render={collection => <FakeComponent collection={collection} />}
        />
      )
      wrapper.setState({ data: fakeCollection })
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
