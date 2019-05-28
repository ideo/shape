import fakeApiStore from '#/mocks/fakeApiStore'
import AddAudienceModal from '~/ui/test_collections/AudienceSettings/AddAudienceModal'

describe('AddAudienceModal', () => {
  let wrapper
  beforeEach(() => {
    const props = {
      apiStore: fakeApiStore(),
      open: true,
      close: jest.fn(),
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

    submitButton = wrapper.find('StyledFormButton')
    expect(submitButton.props()['disabled']).toBeFalsy()
  })
})
