import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class Tag extends BaseRecord {
  static type = 'tags'
  static endpoint = apiUrl('tags')

  attributesForAPI = ['name', 'taggings_count']

  constructor(...args) {
    super(...args)
  }
}

Tag.defaults = {}

export default Tag
