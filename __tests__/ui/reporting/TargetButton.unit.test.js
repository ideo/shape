import TargetButton from '~/ui/reporting/TargetButton'
import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper

const props = {}

const render = () => {
  wrapper = shallow(<TargetButton.wrappedComponent {...props} />)
}

describe('TargetButton', () => {
  beforeEach(() => {
    props.apiStore = fakeApiStore()
    props.item = {
      data_settings: {},
    }
    props.onClick = jest.fn()
    props.editable = true
  })

  describe('componentDidMount', () => {
    describe('collectionFilter present', () => {
      beforeEach(() => {
        props.item.data_settings = {
          d_filters: [
            {
              type: 'Collection',
              target: 1,
            },
          ],
        }
        props.apiStore.fetch = jest.fn()
        render()
      })

      it('fetches the collection', () => {
        wrapper.instance().componentDidMount()
        expect(props.apiStore.fetch).toHaveBeenCalledWith(
          'collections',
          props.item.data_settings.d_filters[0].target
        )
      })
    })

    describe('collectionFilter not present', () => {
      beforeEach(() => {
        props.item.data_settings = {}
        props.apiStore.fetch = jest.fn()
        render()
      })

      it('does not fetch the collection', () => {
        wrapper.instance().componentDidMount()
        expect(props.apiStore.fetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('render', () => {
    it('passes editable and onClick through', () => {
      render()
      expect(wrapper.props().editable).toEqual(props.editable)
      expect(wrapper.props().onClick).toEqual(props.onClick)
    })

    describe('collection filter is present', () => {
      beforeEach(() => {
        props.item.data_settings = {
          d_filters: [
            {
              type: 'Collection',
              target: 1,
            },
          ],
        }
      })

      describe('collection is found in apiStore', () => {
        const collection = { name: 'foo' }

        beforeEach(() => {
          props.apiStore.find = jest.fn(() => collection)
          render()
        })

        it('sets the button text to the collection name', () => {
          expect(props.apiStore.find).toHaveBeenCalledWith(
            'collections',
            props.item.data_settings.d_filters[0].target
          )
          expect(wrapper.children().text()).toEqual(collection.name)
        })
      })

      describe('collection is not found in apiStore', () => {
        beforeEach(() => {
          props.apiStore.find = jest.fn(() => undefined)
          render()
        })

        it('sets the button text to Organization', () => {
          expect(wrapper.children().text()).toEqual('Organization')
        })
      })
    })

    describe('collection filter is not present', () => {
      beforeEach(() => {
        props.item.data_settings = {}
        render()
      })

      it('sets the button text to Organization', () => {
        expect(wrapper.children().text()).toEqual('Organization')
      })
    })
  })
})
