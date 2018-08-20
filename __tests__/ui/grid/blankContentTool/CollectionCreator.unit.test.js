import CollectionCreator from '~/ui/grid/blankContentTool/CollectionCreator'

const e = { preventDefault: jest.fn() }
let wrapper, props, component
describe('MovableGridCard', () => {
  beforeEach(() => {
    props = {
      loading: false,
      template: false,
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn()
    }
    props.createCard.mockClear()
    wrapper = shallow(
      <CollectionCreator {...props} />
    )
    component = wrapper.instance()
  })

  it('renders a BCTTextField', () => {
    expect(wrapper.find('BCTTextField').exists()).toBeTruthy()
    expect(wrapper.find('BCTTextField').props().autoFocus).toBeTruthy()
  })

  describe('createCollection', () => {
    it('calls createCard with input name', () => {
      component.state = {
        inputText: 'Collection Name',
      }
      component.createCollection(e)
      expect(props.createCard).toHaveBeenCalledWith({
        collection_attributes: {
          name: component.state.inputText,
          master_template: props.template,
        },
      })
    })
  })
})
