import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class UsersThread extends BaseRecord {
  static type = 'users_threads'
  static endpoint = apiUrl('users_threads')
}

export default UsersThread
