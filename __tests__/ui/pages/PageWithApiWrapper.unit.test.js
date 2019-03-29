import PageWithApiWrapper from '~/ui/pages/PageWithApiWrapper'
import Deactivated from '~/ui/layout/Deactivated'
import { apiStore, uiStore, routingStore } from '~/stores'

jest.mock('../../../app/javascript/stores')

let wrapper, location, match, props

beforeEach(() => {
  location = {}
  match = {
    path: '/collections/:id',
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

  wrapper = shallow(<PageWithApiWrapper.wrappedComponent {...props} />)
})

describe('PageWithApiWrapper', () => {
  describe('componentDidUpdate', () => {
    describe('checkOrg', () => {
      describe('when the route match.params.org does not match apiStore.currentOrgSlug', () => {
        beforeEach(() => {
          props.match.params.org = 'different-slug'
          wrapper = shallow(<PageWithApiWrapper.wrappedComponent {...props} />)
          wrapper.instance().componentDidUpdate({ location, match })
        })

        it('calls routingStore to make sure /:org namespace is in the path', () => {
          expect(apiStore.currentUser.switchOrganization).toHaveBeenCalledWith(
            'different-slug',
            { redirectPath: routingStore.location.pathname }
          )
        })
      })
      describe('when the route does not have match.params.org', () => {
        beforeEach(() => {
          props.match.params.org = null
          wrapper = shallow(<PageWithApiWrapper.wrappedComponent {...props} />)
          wrapper.instance().componentDidUpdate({ location, match })
        })

        it('calls routingStore to make sure /:org namespace is in the path', () => {
          expect(routingStore.routeTo).toHaveBeenCalledWith(
            `/${apiStore.currentOrgSlug}${routingStore.location.pathname}`
          )
        })
      })
    })
  })

  describe('fetchData', () => {
    beforeEach(() => {
      wrapper.instance().fetchData()
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
    beforeEach(() => {
      wrapper = shallow(
        <PageWithApiWrapper.wrappedComponent
          {...props}
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

    describe('organization is deactivated', () => {
      beforeEach(() => {
        wrapper.setProps({
          apiStore: {
            currentOrgIsDeactivated: true,
          },
        })
      })

      it('renders the Deactivated component', () => {
        expect(wrapper.equals(<Deactivated />)).toEqual(true)
      })
    })
  })
})
