import GroupsModifyDialogActions from '~/ui/groups/GroupsModifyDialogActions'

describe('GroupsModifyDialogActions', () => {
  let props, wrapper, rerender

  beforeEach(() => {
    props = {
      onCancel: jest.fn(),
      groupType: 'Group',
      creatingOrg: false,
      isLoading: false,
      formDisabled: false,
    }
    rerender = () => {
      wrapper = shallow(<GroupsModifyDialogActions {...props} />)
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
      }
      rerender = () => {
        wrapper = shallow(<GroupsModifyDialogActions {...props} />)
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
})
