import EditableName from '~/ui/pages/shared/EditableName'
import fakeUiStore from '#/mocks/fakeUiStore'
import { Heading2 } from '~/ui/global/styled/typography'

let wrapper, props

describe('EditableName', () => {
  describe('when viewing', () => {
    beforeEach(() => {
      props = {
        name: 'Amazing Collection',
        updateNameHandler: jest.fn(),
        canEdit: true,
        uiStore: fakeUiStore,
        fieldName: 'name',
        TypographyComponent: Heading2,
        onDoneEditing: jest.fn(),
      }
      wrapper = shallow(<EditableName.wrappedComponent {...props} />)
    })

    it('renders name in given TypographyComponent', () => {
      expect(wrapper.find('Heading2').text()).toMatch(/Amazing Collection/)
    })
  })

  describe('when editing', () => {
    beforeEach(() => {
      props.fieldName = 'name'
      props.TypographyComponent = Heading2
      wrapper = shallow(<EditableName.wrappedComponent {...props} canEdit />)
      const fakeEvent = {
        stopPropagation: jest.fn(),
      }
      wrapper.instance().startEditingName(fakeEvent)
    })

    it('shows editable field', () => {
      expect(wrapper.find('AutosizeInput').exists()).toEqual(true)
      expect(wrapper.find('AutosizeInput').props().value).toEqual(props.name)
      expect(wrapper.find('Heading2').exists()).toEqual(false)
    })

    it('calls updateNameHandler with name after user edits name', () => {
      wrapper.find('AutosizeInput').simulate('change', {
        target: { value: 'Stellar Collection' },
      })
      // Flush debounced save so it is called
      wrapper.instance().saveName.flush()
      expect(props.updateNameHandler.mock.calls.length).toBe(1)
      expect(props.updateNameHandler).toHaveBeenCalledWith('Stellar Collection')
    })

    it('saves and returns to read-only name when enter is pressed in input', () => {
      expect(props.onDoneEditing).not.toHaveBeenCalled()
      wrapper.find('AutosizeInput').simulate('keyPress', {
        key: 'Enter',
      })
      expect(props.uiStore.editingName).toEqual([])
      expect(props.onDoneEditing).toHaveBeenCalled()
    })

    describe('with placeholder prop and empty name string', () => {
      beforeEach(() => {
        wrapper.setProps({
          ...props,
          name: '',
          placeholder: 'edit your name',
          TypographyComponent: Heading2,
        })
      })

      it('renders the placeholder', () => {
        expect(wrapper.find('AutosizeInput').props().placeholder).toEqual(
          'edit your name'
        )
        expect(wrapper.render().text()).toMatch(/edit your name/)
      })
    })
  })

  describe('if canEdit is false', () => {
    beforeEach(() => {
      wrapper.setProps({
        ...props,
        canEdit: false,
        TypographyComponent: Heading2,
      })
    })

    it('renders name', () => {
      expect(wrapper.render().text()).toMatch(/Amazing Collection/)
    })

    it('does not show editable field when clicked', () => {
      wrapper.find('Heading2').simulate('click', { stopPropagation: jest.fn() })
      expect(wrapper.find('AutosizeInput').exists()).toEqual(false)
    })
  })
})
