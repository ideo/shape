import styled from 'styled-components'
import PropTypes from 'prop-types'
import v from '~/utils/variables'
import Loader from '~/ui/layout/Loader'
import propShapes from '~/utils/propShapes'
import { SubduedTitle } from '~/ui/global/styled/typography'
import { hexToRgba, getCollaboratorColor } from '~/utils/colorUtils'

const CollaboratorTitle = styled(SubduedTitle)`
  display: inline-block;
  padding: 65px 0px 20px 0px;
`

const CardLoader = ({ collaborator }) => {
  const collaboratorColor = getCollaboratorColor(collaborator)
  return (
    <div
      style={{
        top: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: v.zIndex.gridCardTop,
        background: `${props =>
          collaboratorColor
            ? 'transparent'
            : hexToRgba(v.colors.commonDark, 0.5)}`,
        color: `${v.colors.white}`,
      }}
    >
      {collaborator && (
        <CollaboratorTitle color={collaboratorColor}>
          {collaborator.name} is adding content
        </CollaboratorTitle>
      )}
      <Loader
        size={30}
        containerHeight={collaborator ? 'auto' : '100%'}
        animation="circular"
        color={collaborator ? collaboratorColor : v.colors.commonDark}
      />
    </div>
  )
}
CardLoader.propTypes = {
  collaborator: PropTypes.shape(propShapes.collaborator),
}
CardLoader.defaultProps = {
  collaborator: null,
}

export default CardLoader
