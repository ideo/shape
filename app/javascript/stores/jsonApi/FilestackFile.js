import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class FilestackFile extends BaseRecord {
  static type = 'filestack_files'
  static endpoint = apiUrl('filestack_files')
}

export default FilestackFile
