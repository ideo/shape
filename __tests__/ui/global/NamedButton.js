import NamedButton from '~/ui/global/NamedButton'

let props, wrapper
describe('NamedButton', () => {
  beforeEach(() => {
    props = {
      name: 'Challenge Settings',
      onClick: jest.fn(),
    }

    wrapper = shallow(<NamedButton {...props} />)
  })

  it('should render a Button', () => {
    expect(wrapper.find('Button').exists()).toBeTruthy()
  })
})
