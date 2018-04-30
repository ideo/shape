import BaseRecord from './BaseRecord'

class Organization extends BaseRecord {
  attributesForAPI = ['name', 'domain_whitelist', 'filestack_file_attributes']
}

Organization.type = 'organization'

export default Organization
