import DataItemCreator from '~/ui/grid/blankContentTool/DataItemCreator'
import { ITEM_TYPES } from '~/utils/variables'

const e = { preventDefault: jest.fn() }
let wrapper, props, component
describe('DataItemCreator', () => {
  beforeEach(() => {
    props = {
      loading: false,
      createCard: jest.fn(),
      closeBlankContentTool: jest.fn(),
    }
    props.createCard.mockClear()
    wrapper = shallow(<DataItemCreator {...props} />)
    component = wrapper.instance()
  })

  it('calls createCard with DataItem type and report name', () => {
    component.state = {
      inputText: 'My Report name',
    }
    component.createItem(e)
    expect(props.createCard).toHaveBeenCalledWith({
      item_attributes: {
        type: ITEM_TYPES.DATA,
        name: component.state.inputText,
      },
    })
  })
})
