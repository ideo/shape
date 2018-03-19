import EditableName from '~/ui/pages/shared/EditableName'

let wrapper, props

describe('EditableName', () => {
  describe('when viewing', () => {
    beforeEach(() => {
      props = {
        name: 'Amazing Collection',
        updateNameHandler: jest.fn()
      }
      wrapper = shallow(
        <EditableName {...props} />
      )
    })

    it('renders name', () => {
      expect(wrapper.render().text()).toMatch(/Amazing Collection/)
    })

    it('shows editable field when clicked', () => {
      wrapper.find('H1').simulate('click', { stopPropagation: jest.fn() })
      expect(wrapper.find('AutosizeInput').exists()).toEqual(true)
      expect(wrapper.find('AutosizeInput').props().value).toEqual(props.name)
      expect(wrapper.find('H1').exists()).toEqual(false)
    })
  })

  describe('when editing', () => {
    beforeEach(() => {
      props = {
        name: 'Amazing Collection',
        updateNameHandler: jest.fn(),
        editing: true,
      }
      wrapper = shallow(
        <EditableName {...props} />
      )
    })

    it('shows editable field', () => {
      expect(wrapper.find('AutosizeInput').exists()).toEqual(true)
      expect(wrapper.find('AutosizeInput').props().value).toEqual(props.name)
      expect(wrapper.find('H1').exists()).toEqual(false)
    })

    it('calls updateNameHandler with name after user edits name', () => {
      wrapper.find('AutosizeInput').simulate('change', {
        target: { value: 'Stellar Collection' }
      })
      // Flush debounced save so it is called
      wrapper.instance().saveName.flush()
      expect(props.updateNameHandler.mock.calls.length).toBe(1)
      expect(props.updateNameHandler).toHaveBeenCalledWith('Stellar Collection')
    })

    it('saves and returns to read-only name when enter is pressed in input', () => {
      wrapper.find('AutosizeInput').simulate('keyPress', {
        key: 'Enter'
      })
      expect(wrapper.find('H1').exists()).toEqual(true)
    })
  })
})
