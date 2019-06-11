import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'

import Modal from '~/ui/global/modals/Modal'
import { FieldContainer, Label, TextField } from '~/ui/global/styled/forms'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import v from '~/utils/variables'

const SelectedOptionsWrapper = styled(Flex)`
  min-height: 40px;
`

const SelectedOption = styled.span`
  background: ${v.colors.commonLightest};
  font-family: ${v.fonts.sans};
  margin-bottom: 8px;
  margin-right: 8px;
  padding: 8px 12px;
`
SelectedOption.displayName = 'SelectedOption'

@inject('apiStore', 'uiStore')
@observer
class AdminAudienceModal extends React.Component {
  handleClose = () => {
    const { uiStore } = this.props
    uiStore.update('adminAudienceMenuOpen', null)
  }

  renderCriteriaRow(criteria) {
    return (
      <FieldContainer>
        <SelectedOptionsWrapper wrap>
          <SelectedOption key={`selected_${criteria}`}>
            {criteria}
          </SelectedOption>
        </SelectedOptionsWrapper>
        <HorizontalDivider
          color={v.colors.commonMedium}
          style={{ borderWidth: '0 0 1px 0', marginBlockStart: 0 }}
        />
      </FieldContainer>
    )
  }

  renderCriteria() {
    const { audience } = this.props
    const criteria = audience.tag_list
    return criteria.map(criteria => {
      return this.renderCriteriaRow(criteria)
    })
  }

  render() {
    const { audience, open } = this.props
    if (!open) return null

    const title = `${audience.name} Definition`

    return (
      <Modal title={title} onClose={this.handleClose} open={open} noScroll>
        <React.Fragment>
          <FieldContainer>
            <Label htmlFor="audienceName">Audience Name</Label>
            <TextField
              id="audienceName"
              type="text"
              data-cy="TextField_audienceName"
              value={audience.name}
              onChange={this.handleNameChange}
              disabled
            />
          </FieldContainer>
          <Box mb={2}>
            <Label>Targeting Criteria</Label>
          </Box>
          {this.renderCriteria()}
        </React.Fragment>
      </Modal>
    )
  }
}

AdminAudienceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  audience: PropTypes.shape({
    name: PropTypes.string.isRequired,
    // TODO:  need anything else here?
  }).isRequired,
}
AdminAudienceModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminAudienceModal
