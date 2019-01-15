import _ from 'lodash'
import { observable, action, runInAction } from 'mobx'
import { apiUrl } from '~/utils/url'

import BaseRecord from './BaseRecord'

class Role extends BaseRecord {
  static type = 'roles'
  static endpoint(collectionId) {
    return apiUrl(`collections/${collectionId}/roles`)
  }

  // NOTE: these counts are not actually specific to THIS role it is more
  // about the resource that this role is attached to
  @observable
  activeCount = 0
  @observable
  pendingCount = 0
  @observable
  prevUsers = []
  @observable
  prevGroups = []

  get label() {
    const { name, resource } = this
    if (name === 'viewer' && resource && resource.isSubmissionBox) {
      return 'participant'
    }
    return name
  }

  @action
  updateCount(type, count) {
    if (['pending', 'active'].indexOf(type) === -1) return
    this[`${type}Count`] = count
  }

  @action
  capturePrevLists({ reset = false } = {}) {
    this.prevUsers = [...this.users]
    this.prevGroups = [...this.groups]
    if (reset) {
      this.users.replace([])
      this.groups.replace([])
    }
  }

  @action
  mergePrevLists() {
    this.users.replace(_.uniqBy([...this.users, ...this.prevUsers], 'id'))
    this.groups.replace(_.uniqBy([...this.groups, ...this.prevGroups], 'id'))
  }

  API_delete(entity, ownerId, ownerType, opts = {}) {
    const params = {
      role: {
        name: this.name,
      },
      is_switching: opts.isSwitching,
    }
    if (entity.internalType === 'groups') {
      params.group_ids = [entity.id]
    } else {
      params.user_ids = [entity.id]
    }
    return this.apiStore
      .request(`${ownerType}/${ownerId}/roles/${this.id}`, 'DELETE', params)
      .then(res => {
        runInAction(() => {
          if (entity.internalType === 'users') {
            this.users = _.reject(this.users, { id: entity.id })
            this.updateCount(entity.status, this[`${entity.status}Count`] - 1)
          } else {
            this.groups = _.reject(this.groups, { id: entity.id })
            this.updateCount('active', this.activeCount - 1)
          }
        })
      })
  }

  // NOTE: RolesMenu also has its own createRoles method -- not sure if this one is used anywhere?
  API_create() {
    // TODO why can't the API figure out where name is if calling toJsonApi?
    return this.apiStore.request(
      `collections/${this.resourceId}/roles`,
      'POST',
      {
        role: {
          name: this.name,
        },
        user_ids: this.users.map(user => user.id),
      }
    )
  }
}

export default Role
