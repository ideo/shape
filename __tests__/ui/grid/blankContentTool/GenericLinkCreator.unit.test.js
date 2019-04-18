import GenericLinkCreator from '~/ui/grid/blankContentTool/GenericLinkCreator'
import expectTreeToMatchSnapshot from '#/helpers/expectTreeToMatchSnapshot'

let wrapper, props
describe('GenericLinkCreator', () => {
  beforeEach(() => {
    props = {
      url: '',
      urlValid: false,
      loading: false,
      placeholder: 'Create link',
      onSubmit: jest.fn(),
      onChange: jest.fn(),
      onClose: jest.fn(),
      password: '',
      passwordField: false,
      onPasswordChange: jest.fn(),
    }
    wrapper = shallow(<GenericLinkCreator {...props} />)
  })

  it('renders snapshot', () => {
    expectTreeToMatchSnapshot(wrapper)
  })

  it('renders a form with a BctTextField', () => {
    expect(wrapper.find('form').props().onSubmit).toEqual(props.onSubmit)
    expect(wrapper.find('BctTextField').length).toEqual(1)
    expect(wrapper.find('BctTextField').get(0).props.placeholder).toEqual(
      props.placeholder
    )
  })

  it('calls onChange callback', () => {
    const textField = wrapper.find('BctTextField').get(0)
    expect(textField.props.onChange).toEqual(props.onChange)
  })

  describe('with passwordField', () => {
    beforeEach(() => {
      wrapper = shallow(<GenericLinkCreator {...props} passwordField />)
    })

    it('renders a passwordField if indicated', () => {
      expect(wrapper.find('BctTextField').length).toEqual(2)
      const pwField = wrapper.find('BctTextField').get(1)
      expect(pwField.props.type).toEqual('password')
      expect(pwField.props.placeholder).toEqual('Enter password')
    })

    it('calls onPasswordChange callback', () => {
      const pwField = wrapper.find('BctTextField').get(1)
      expect(pwField.props.onChange).toEqual(props.onPasswordChange)
    })
  })
})
