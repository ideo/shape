import CommentInput from '~/ui/threads/CommentInput'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { EditorState } from 'draft-js'

let wrapper, props, uiStore, apiStore, component
describe('CommentInput', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()
    uiStore = fakeUiStore

    props = {
      disabled: false,
      onChange: jest.fn(),
      onOpenSuggestions: jest.fn(),
      onCloseSuggestions: jest.fn(),
      handleReturn: jest.fn(),
      setEditor: jest.fn(),
      editorState: EditorState.createEmpty(),
      uiStore,
      apiStore,
    }
    wrapper = shallow(<CommentInput.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  it('renders the DraftJS Plugin Editor with MentionSuggestions', () => {
    expect(wrapper.find('PluginEditor').exists()).toBeTruthy()
    expect(wrapper.find('MentionSuggestions').exists()).toBeTruthy()
  })

  it('calls apiStore.searchUsersAndGroups', () => {
    component._searchUsersAndGroups({ query: 'ideo', per_page: 6 })
    expect(apiStore.searchUsersAndGroups).toHaveBeenCalledWith({
      query: 'ideo',
      per_page: 6,
    })
  })
})
