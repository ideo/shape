import VideoItem from '~/ui/items/VideoItem'

import { fakeVideoItem } from '#/mocks/data'

const props = {
  item: fakeVideoItem,
}

let wrapper
describe('VideoItem', () => {
  beforeEach(() => {
    wrapper = shallow(<VideoItem {...props} />)
  })

  it('renders the VideoPlayer', () => {
    expect(wrapper.find('VideoPlayer').exists()).toBe(true)
  })

  it('passes the video url to the VideoPlayer', () => {
    expect(wrapper.find('VideoPlayer').props().url).toEqual(fakeVideoItem.url)
  })
})
