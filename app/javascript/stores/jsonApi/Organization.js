import BaseRecord from './BaseRecord'

class Organization extends BaseRecord {
  attributesForAPI = ['name', 'handle', 'filestack_file_attributes']
}

Organization.type = 'organizations'

export default Organization
