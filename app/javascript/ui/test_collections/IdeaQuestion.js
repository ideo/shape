import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import MediaQuestion from '~/ui/test_collections/MediaQuestion'
import QuestionContentEditor from '~/ui/test_collections/QuestionContentEditor'

class IdeaQuestion extends React.Component {
  render() {
    const { card, parent, canEdit } = this.props
    return (
      <Fragment>
        <QuestionContentEditor
          placeholder="add idea title here…"
          item={card.record}
          itemAttribute="name"
          canEdit={canEdit}
          maxLength={100}
        />
        <MediaQuestion parent={parent} card={card} />
        <QuestionContentEditor
          placeholder="add idea description here…"
          item={card.record}
          itemAttribute="content"
          canEdit={canEdit}
        />
      </Fragment>
    )
  }
}

IdeaQuestion.propTypes = {
  // parent is the parent collection
  parent: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool.isRequired,
}
IdeaQuestion.displayName = 'IdeaQuestion'

export default IdeaQuestion
