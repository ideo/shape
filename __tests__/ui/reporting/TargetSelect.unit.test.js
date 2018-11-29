import TargetSelect from '~/ui/reporting/TargetSelect'
import fakeApiStore from '#/mocks/fakeApiStore'
import { Select } from '~/ui/global/styled/forms'
import AutoComplete from '~/ui/global/AutoComplete'

let wrapper

const props = {}

const render = () => {
  wrapper = shallow(<TargetSelect.wrappedComponent {...props} />)
}

describe('TargetSelect', () => {
  beforeEach(() => {
    props.apiStore = fakeApiStore()
    props.item = {
      data_settings: {},
    }
    props.onSelect = jest.fn()
  })

  describe('componentDidMount', () => {
    const searchResult = { data: [{ foo: 'bar' }] }
    beforeEach(() => {
      props.apiStore.searchCollections = jest
        .fn()
        .mockResolvedValue(searchResult)
      render()
      wrapper.instance().componentDidMount()
    })

    it('loads the collections', () => {
      expect(wrapper.instance().collections).toEqual(searchResult.data)
    })

    describe('collection filter is present', () => {
      beforeEach(() => {
        props.item.data_settings.d_filters = [{ type: 'Collection', target: 1 }]
        render()
        wrapper.instance().componentDidMount()
      })

      it('sets the type to Collection', () => {
        expect(wrapper.instance().type).toEqual('Collection')
      })
    })

    describe('collection filter is not present', () => {
      beforeEach(() => {
        props.item.data_settings = {}
        render()
        wrapper.instance().componentDidMount()
      })

      it('leaves the type as Organization', () => {
        expect(wrapper.instance().type).toEqual('Organization')
      })
    })
  })

  describe('handleChange', () => {
    const event = {
      preventDefault: jest.fn(),
      target: {},
    }
    it('prevents the event default', () => {
      render()
      wrapper.instance().handleChange(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('sets the type to the value', () => {
      render()
      event.target.value = 'foo'
      wrapper.instance().handleChange(event)
      expect(wrapper.instance().type).toEqual(event.target.value)
    })

    describe('value is Organization', () => {
      it('triggers onSelect with no value', () => {
        event.target.value = 'Organization'
        render()
        wrapper.instance().handleChange(event)
        expect(props.onSelect).toHaveBeenCalledWith()
      })
    })

    describe('value is not organization', () => {
      describe('collectionFilter present', () => {
        it('calls onSelect with the collectionFilter target', () => {
          props.onSelect.mockReset()
          props.item.data_settings.d_filters = [
            { type: 'Collection', target: 1 },
          ]
          render()
          event.target.value = 'foo'
          wrapper.instance().handleChange(event)
          expect(props.onSelect).toHaveBeenCalledWith(1)
        })
      })

      describe('collectionFilter not present', () => {
        it('does not call onSelect', () => {
          props.onSelect.mockReset()
          props.item.data_settings.d_filters = []
          render()
          event.target.value = 'foo'
          wrapper.instance().handleChange(event)
          expect(props.onSelect).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('render', () => {
    it('sets the select onChange to handleChange', () => {
      render()
      expect(wrapper.find(Select).props().onChange).toEqual(
        wrapper.instance().handleChange
      )
    })

    describe('Select value', () => {
      describe('collectionFilter present', () => {
        it('sets the current value to Collection', () => {
          props.item.data_settings.d_filters = [
            { type: 'Collection', target: 1 },
          ]
          render()
          expect(wrapper.find(Select).props().value).toEqual('Collection')
        })
      })

      describe('collectionFilter not present', () => {
        it('sets the current value to type', () => {
          props.item.data_settings.d_filters = []
          render()
          expect(wrapper.find(Select).props().value).toEqual(
            wrapper.instance().type
          )
        })
      })
    })

    describe('select options', () => {
      it('has select options for Organization and Collection', () => {
        render()
        const options = ['Organization', 'Collection']
        options.forEach((name, i) => {
          const o = wrapper.find(Select).childAt(i)
          expect(o.children().text()).toEqual(name)
          expect(o.props().value).toEqual(name)
        })
      })
    })

    describe('Collection name autocomplete', () => {
      describe('when type is Collection', () => {
        it('renders the AutoComplete', done => {
          props.item.data_settings.d_filters = [
            { type: 'Collection', target: 1 },
          ]
          render()
          setTimeout(() => {
            wrapper.instance().collections = [
              { id: 1, name: 'foo' },
              { id: 2, name: 'bar' },
            ]
            wrapper.update()
            const p = wrapper.find(AutoComplete).props()
            expect(p.options).toEqual([
              {
                label: 'foo',
                value: 1,
              },
              {
                label: 'bar',
                value: 2,
              },
            ])
            expect(p.placeholder).toEqual('Collection name')
            expect(p.value).toEqual(1)
            expect(p.keepSelectedOptions).toEqual(true)
            done()
          }, 100)
        })
      })

      describe('when type is not Collection', () => {
        it('does not render the Autocomplete', () => {
          props.item.data_settings.d_filters = []
          render()
          expect(wrapper.find(AutoComplete).length).toEqual(0)
        })
      })
    })
  })
})
