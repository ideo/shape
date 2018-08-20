import CollectionCreator from '~/ui/grid/blankContentTool/CollectionCreator'

const e = { preventDefault: jest.fn() }
let wrapper, props, component
describe('MovableGridCard', () => {
  beforeEach(() => {
    props = {
      loading: false,
      type: 'collection',
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn()
    }
    props.createCard.mockClear()
    wrapper = shallow(
      <CollectionCreator {...props} />
    )
    component = wrapper.instance()
  })

  it('renders a BctTextField', () => {
    expect(wrapper.find('BctTextField').props().placeholder).toEqual('Collection name')
    expect(wrapper.find('BctTextField').props().autoFocus).toBeTruthy()
  })

  describe('createCollection', () => {
    it('calls createCard with input name', () => {
      component.state = {
        inputText: 'New Projects',
      }
      component.createCollection(e)
      expect(props.createCard).toHaveBeenCalledWith({
        collection_attributes: {
          name: component.state.inputText,
          master_template: false,
        },
      })
    })
  })
})
