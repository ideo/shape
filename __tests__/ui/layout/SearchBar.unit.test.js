import SearchBar from '~/ui/layout/SearchBar'

let props, wrapper, rerender
describe('SearchBar', () => {
  beforeEach(() => {
    props = {
      value: '',
      onChange: jest.fn(),
      onClear: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<SearchBar {...props} />)
    }
    rerender()
  })

  describe('render()', () => {
    it('renders the search icon', () => {
      expect(wrapper.find('SearchIcon').exists()).toBeTruthy()
    })

    it('renders the close button when there is search text', () => {
      props.value = 'sdf'
      rerender()
      expect(wrapper.find('button.close').exists()).toBeTruthy()
    })
  })

  describe('clearSearch()', () => {
    const fakeEv = { preventDefault: jest.fn() }
    beforeEach(() => {
      props.value = 'something'
      rerender()
      wrapper.find('.close').simulate('click', fakeEv)
    })

    it('calls the clear handler', () => {
      expect(props.onClear).toHaveBeenCalled()
    })
  })

  describe('onSearching', () => {
    const value = 'test'

    beforeEach(() => {
      const ev = { target: { value } }
      wrapper.find('input').simulate('change', ev)
    })

    it('should call the on change handler prop', () => {
      expect(props.onChange).toHaveBeenCalledWith(value)
    })
  })
})
