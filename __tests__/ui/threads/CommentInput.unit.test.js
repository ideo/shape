import CommentInput from '~/ui/threads/CommentInput'
import fakeApiStore from '#/mocks/fakeApiStore'
import { EditorState } from 'draft-js'

let wrapper, props, apiStore, component
describe('CommentInput', () => {
  beforeEach(() => {
    apiStore = fakeApiStore()

    props = {
      onChange: jest.fn(),
      onOpenSuggestions: jest.fn(),
      onCloseSuggestions: jest.fn(),
      handleReturn: jest.fn(),
      setEditor: jest.fn(),
      editorState: EditorState.createEmpty(),
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
    component._searchUsersAndGroups('ideo')
    expect(apiStore.searchUsersAndGroups).toHaveBeenCalledWith('ideo')
  })
})
