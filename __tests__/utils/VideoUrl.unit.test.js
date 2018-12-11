import VideoUrl from '~/utils/VideoUrl'
import v from '~/utils/variables'

const validYoutubeUrls = [
  'http://www.youtube.com/watch?v=-wtIM49CWuI',
  'http://www.youtube.com/v/-wtIM49CWuI?version=3&autohide=1',
  'http://youtu.be/-wtIM49CWuI',
  'http://www.youtube.com/embed/-wtIM49CWuI',
]

const invalidYoutubeUrls = [
  'https://www.youtube.com/results?search_query=puppies',
  'https://www.youtuberz.com/?v=-wtIM49CWuI',
]

const validVimeoUrls = [
  'https://vimeo.com/12345678',
  'http://vimeo.com/12345678',
  'https://vimeo.com/groups/abc123/videos/12345678',
  'https://vimeo.com/album/abc123/video/12345678',
]

const invalidVimeoUrls = [
  'https://vimeo.com/channels/staffpicks',
  'https://vimeo.com/groups/12345678',
  'https://vimeomeomeo.com/131244',
]

describe('isValid', () => {
  describe('Youtube', () => {
    it('is true for all valid urls', () => {
      validYoutubeUrls.forEach(url => expect(VideoUrl.isValid(url)).toBe(true))
    })

    it('is false for all invalid urls', () => {
      invalidYoutubeUrls.forEach(url =>
        expect(VideoUrl.isValid(url)).toBe(false)
      )
    })
  })

  describe('Vimeo', () => {
    it('is true for all valid urls', () => {
      validVimeoUrls.forEach(url => expect(VideoUrl.isValid(url)).toBe(true))
    })

    it('is false for all invalid urls', () => {
      invalidVimeoUrls.forEach(url => expect(VideoUrl.isValid(url)).toBe(false))
    })
  })
})

describe('parse', () => {
  describe('Youtube', () => {
    it('returns id and service for all valid urls', () => {
      validYoutubeUrls.forEach(url => {
        const { id, service } = VideoUrl.parse(url)
        expect(id).toEqual('-wtIM49CWuI')
        expect(service).toEqual('youtube')
      })
    })
  })

  describe('Vimeo', () => {
    it('returns id and service for all valid urls', () => {
      validVimeoUrls.forEach(url => {
        const { id, service } = VideoUrl.parse(url)
        expect(id).toEqual('12345678')
        expect(service).toEqual('vimeo')
      })
    })
  })
})

describe('privateVideoDefaults', () => {
  describe('with url', () => {
    it('gets the vimeo collection/id', () => {
      const details = VideoUrl.privateVideoDefaults({
        url: 'https://vimeo.com/123/456',
      })
      expect(details.thumbnailUrl).toEqual(v.defaults.video.thumbnailUrl)
      expect(details.id).toEqual('123/456')
    })
  })
  describe('with id', () => {
    it('sets the default attributes', () => {
      const details = VideoUrl.privateVideoDefaults({
        id: 'some-id',
      })
      expect(details.thumbnailUrl).toEqual(v.defaults.video.thumbnailUrl)
      expect(details.id).toEqual('some-id')
    })
  })
})
