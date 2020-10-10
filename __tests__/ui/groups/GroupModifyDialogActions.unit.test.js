import GroupModifyDialogActions from '~/ui/groups/GroupModifyDialogActions'

describe('GroupModifyDialogActions', () => {
  let props, wrapper, rerender

  beforeEach(() => {
    props = {
      onCancel: jest.fn(),
      groupType: 'Group',
      creatingOrg: false,
      isLoading: false,
      formDisabled: false,
      onSave: jest.fn(),
    }
    rerender = () => {
      wrapper = shallow(<GroupModifyDialogActions {...props} />)
    }
    rerender()
  })

  it('should render an Add Members Button', () => {
    expect(wrapper.find('Button').exists()).toBe(true)
    expect(wrapper.find('Button').html()).toContain('Add Members')
  })

  describe('creating an org', () => {
    beforeEach(() => {
      props = {
        onCancel: jest.fn(),
        groupType: 'Organization',
        creatingOrg: true,
        isLoading: false,
        formDisabled: false,
        onSave: jest.fn(),
      }
      rerender = () => {
        wrapper = shallow(<GroupModifyDialogActions {...props} />)
      }
      rerender()
    })

    it('should render an Add Members Button', () => {
      expect(wrapper.find('Button').exists()).toBe(true)
      expect(wrapper.find('Button').html()).toContain('Save')
    })

    it('should render a SubduedText', () => {
      expect(wrapper.find('SubduedText').exists()).toBe(true)
    })

    it('should render a Come Back Later TextButton', () => {
      expect(wrapper.find('TextButton').exists()).toBe(true)
      expect(wrapper.find('TextButton').html()).toContain('Come back later')
    })
  })

  describe('with formDisabled = true', () => {
    beforeEach(() => {
      props.formDisabled = true
      rerender()
    })
    it('should disable the form button', () => {
      expect(wrapper.find('Button').props().disabled).toBe(true)
    })
  })

  describe('with isLoading = true', () => {
    beforeEach(() => {
      props.isLoading = true
      rerender()
    })

    it('should disable the form button', () => {
      expect(wrapper.find('Button').props().disabled).toBe(true)
    })
  })

  describe('onSave', () => {
    it('should call the onSave prop', () => {
      wrapper.find('Button').simulate('click')
      expect(props.onSave).toHaveBeenCalled()
    })
  })
})
