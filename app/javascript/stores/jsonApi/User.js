import { routingStore, uiStore } from '~/stores'
import BaseRecord from './BaseRecord'

class User extends BaseRecord {
  get name() {
    return [this.first_name, this.last_name].join(' ')
  }

  isCurrentUser() {
    return this.apiStore.currentUserId === this.id
  }

  async API_acceptTerms() {
    try {
      return await this.apiStore.request('users/accept_terms', 'POST')
    } catch (e) {
      uiStore.defaultAlertError()
      return e
    }
  }

  async switchOrganization(organizationId,
    { routeToCollectionId, routeToItemId } = {}) {
    uiStore.update('isLoading', true)
    const user = await this.apiStore.request(
      `/users/switch_org`,
      'POST',
      { organization_id: organizationId }
    )
    if (routeToItemId) return
    let collectionId = user.data.current_user_collection_id
    if (routeToCollectionId) collectionId = routeToCollectionId
    routingStore.routeTo(`/collections/${collectionId}`)
  }
}
User.type = 'users'

export default User
