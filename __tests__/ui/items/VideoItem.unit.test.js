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

  it('renders the React player', () => {
    expect(wrapper.find('ReactPlayer').exists()).toBe(true)
  })

  it('passes the video url to the React player', () => {
    expect(wrapper.find('ReactPlayer').props().url).toEqual(fakeVideoItem.url)
  })
})
