import _ from 'lodash'
import { action } from 'mobx'
import v from '~/utils/variables'

const CollaboratingMixin = superclass =>
  class extends superclass {
    // this is used to highlight someone making an edit on a card
    @action
    setCollaborators(collaborators) {
      const { collaboratorColors } = this.uiStore
      const { currentUserId } = this.apiStore
      const otherCollaborators = _.reject(
        collaborators,
        c => c.id === currentUserId
      )
      const sorted =
        // sort by most recent first
        _.reverse(
          _.sortBy(otherCollaborators, e => {
            return new Date(e.timestamp)
          })
        )

      _.each(sorted, collaborator => {
        if (!collaboratorColors.has(collaborator.id)) {
          // size starts at 0 before any are added, this should get the first color
          const nextColor =
            v.collaboratorColorNames[collaboratorColors.size % 10]
          collaboratorColors.set(collaborator.id, nextColor)
        }
        collaborator.color = collaboratorColors.get(collaborator.id)
      })
      this.collaborators.replace(sorted)
    }
  }

export default CollaboratingMixin
