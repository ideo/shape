import fakeApiStore from '#/mocks/fakeApiStore'
import AddAudienceModal from '~/ui/test_collections/AudienceSettings/AddAudienceModal'

const waitForAsync = () => new Promise(resolve => setImmediate(resolve))

describe('AddAudienceModal', () => {
  let props, wrapper

  beforeEach(() => {
    props = {
      apiStore: fakeApiStore(),
      open: true,
      close: jest.fn(),
      afterSave: jest.fn(),
    }
    wrapper = shallow(<AddAudienceModal.wrappedComponent {...props} />)
  })

  it('validates form when inputting name', () => {
    let submitButton = wrapper.find('StyledFormButton')
    expect(submitButton.exists()).toBeTruthy()
    expect(submitButton.props()['disabled']).toBeTruthy()

    const nameField = wrapper.find('#audienceName')
    expect(nameField.exists()).toBeTruthy()

    const name = 'Test'
    nameField.simulate('change', { target: { value: name } })

    const state = wrapper.state()
    expect(state.name).toEqual(name)
    expect(state.valid).toEqual(true)

    // Add a criteria interest so button is not disabled
    const addCriteriaButton = wrapper.find('Button')
    addCriteriaButton.simulate('click')
    const criteriaMenu = wrapper.find('StyledSelect')
    criteriaMenu.simulate('change', { target: { value: ['Age'] } })
    const ageMenu = wrapper.find('StyledSelect')
    const genX = 'Age Gen X (born 1965-1980)'
    wrapper.find(`StyledCheckboxSelectOption[value="${genX}"]`)
    ageMenu.simulate('change', { target: { value: [genX] } })

    submitButton = wrapper.find('StyledFormButton')
    expect(submitButton.props()['disabled']).toBeFalsy()
  })

  it('adds and removes criteria', () => {
    const addCriteriaButton = wrapper.find('Button')
    expect(addCriteriaButton.exists()).toBeTruthy()
    addCriteriaButton.simulate('click')

    const criteriaMenu = wrapper.find('StyledSelect')
    expect(criteriaMenu.exists()).toBeTruthy()

    const age = 'Age'
    const ageCriteriaOption = wrapper.find(`StyledSelectOption[value="${age}"]`)
    expect(ageCriteriaOption.exists()).toBeTruthy()

    criteriaMenu.simulate('change', { target: { value: [age] } })

    const ageMenu = wrapper.find('StyledSelect')
    expect(ageMenu.exists()).toBeTruthy()

    const genX = 'Age Gen X (born 1965-1980)'
    const genXOption = wrapper.find(
      `StyledCheckboxSelectOption[value="${genX}"]`
    )
    expect(genXOption.exists()).toBeTruthy()

    ageMenu.simulate('change', { target: { value: [genX] } })

    let selectedOption = wrapper.find('SelectedOption')
    expect(selectedOption.exists()).toBeTruthy()
    expect(selectedOption.html()).toMatch('Gen X (born 1965-1980)')

    const deleteButton = wrapper.find('DeleteButton')
    expect(deleteButton.exists()).toBeTruthy()
    deleteButton.simulate('click')

    selectedOption = wrapper.find('SelectedOption')
    expect(selectedOption.exists()).toBeFalsy()
  })

  it('runs a post-save callback', async () => {
    const submitButton = wrapper.find('StyledFormButton')
    const nameField = wrapper.find('#audienceName')

    nameField.simulate('change', { target: { value: 'Test Audience' } })
    submitButton.simulate('click')

    await waitForAsync()
    expect(props.afterSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Audience' })
    )
  })
})
