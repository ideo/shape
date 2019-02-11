import VideoPlayer from '~/ui/items/VideoPlayer'

import { fakeVideoItem } from '#/mocks/data'

const props = {
  url: fakeVideoItem.url, // fake youtube video
  width: '100',
  height: '100',
  playing: false,
}
const fordVideoId = '08ebc122-eaa4-4ae4-839a-8497c044d409'

let wrapper
describe('VideoPlayer', () => {
  describe('with a youtube video', () => {
    beforeEach(() => {
      wrapper = shallow(<VideoPlayer {...props} />)
    })

    it('renders the ReactPlayer', () => {
      expect(wrapper.find('ReactPlayer').props().url).toEqual(fakeVideoItem.url)
    })
  })

  describe('with a vbrick video', () => {
    beforeEach(() => {
      wrapper = shallow(
        <VideoPlayer
          {...props}
          url={`https://videosat.ford.com/#/videos/${fordVideoId}`}
        />
      )
    })

    it('renders an iframe with vbrick embed', () => {
      expect(wrapper.find('iframe').props().src).toEqual(
        `https://videosat.ford.com/embed?id=${fordVideoId}`
      )
    })
  })
})
