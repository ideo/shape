import { apiUrl } from '~/utils/url'
import BaseRecord from './BaseRecord'

class Section extends BaseRecord {
  static type = 'sections'
  static endpoint = apiUrl('sections')

  attributesForAPI = ['name', 'width', 'height', 'row', 'col', 'parent_id']
}

export default Section
