import SuggestedTagsBanner, {
  formatSuggestedTags,
} from '~/ui/global/SuggestedTagsBanner'

import { fakeCollection } from '#/mocks/data'

let props, wrapper
describe('SuggestedTagsBanner', () => {
  beforeEach(() => {
    props = {
      collection: {
        ...fakeCollection,
        submissionTypeName: 'Workplace Idea',
      },
    }
    // mount so we can easily access left and right components
    wrapper = mount(<SuggestedTagsBanner {...props} />)
  })

  it('renders banner with text', () => {
    expect(wrapper.find('Banner')).toBeTruthy()
    expect(wrapper.find('StyledHeading3').text()).toEqual(
      'Add Tags To Your Workplace Idea'
    )
  })

  // TODO: add test once hiding functionality is completed
  // it('dismisses banner when x is clicked', () => {
  //   wrapper.find('CloseTagWrapper').simulate('click', {})
  // })
})

describe('formatSuggestedTags', () => {
  it('marks suggested tag as selected if in existing tags', () => {
    const tags = formatSuggestedTags({
      suggestions: ['community', 'blockchain'],
      existingTags: ['cats', 'blockchain'],
      onSelect: () => null,
    })
    const community = tags.find(t => t.label === 'community')
    expect(community.selected).toBe(false)
    const blockchain = tags.find(t => t.label === 'blockchain')
    expect(blockchain.selected).toBe(true)
  })
})
