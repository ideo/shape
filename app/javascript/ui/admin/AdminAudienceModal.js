import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { Flex, Box } from 'reflexbox'
import { map, capitalize } from 'lodash'
import Modal from '~/ui/global/modals/Modal'
import {
  FieldContainer,
  Label,
  TextField,
  TextButton,
} from '~/ui/global/styled/forms'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import v from '~/utils/variables'
import { tagListsToCriteria } from '~/ui/test_collections/AudienceSettings/AudienceCriteria'

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

  capitalizeOption(option) {
    return option
      .split(' ')
      .map(str => capitalize(str))
      .join(' ')
  }

  renderCriteriaRow(criteria, listName) {
    return (
      <FieldContainer key={`selected_${listName}`}>
        <Label data-cy="AdminAudienceCategory">{listName}</Label>
        <SelectedOptionsWrapper wrap>
          {map(criteria, option => {
            return (
              <SelectedOption
                data-cy="AdminAudienceCategoryOption"
                key={`selected_${option}`}
              >
                {this.capitalizeOption(option)}
              </SelectedOption>
            )
          })}
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
    const { tagLists } = audience

    return map(tagLists, (value, key) => {
      if (value.length < 1) return null
      const listName = tagListsToCriteria[key]
      return this.renderCriteriaRow(value, listName)
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
            <Label data-cy="Label_audienceName" htmlFor="audienceName">
              Audience Name
            </Label>
            <TextField
              id="audienceName"
              type="text"
              data-cy="TextField_audienceName"
              value={audience.name}
              disabled
            />
          </FieldContainer>
          <Box mb={1}>
            <Label>Targeting Criteria</Label>
          </Box>
          {this.renderCriteria()}
          <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
            <TextButton
              data-cy="CloseModalButton"
              onClick={this.handleClose}
              width={200}
            >
              Close
            </TextButton>
          </div>
        </React.Fragment>
      </Modal>
    )
  }
}

AdminAudienceModal.propTypes = {
  open: PropTypes.bool,
  audience: MobxPropTypes.objectOrObservableObject,
}
AdminAudienceModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
AdminAudienceModal.defaultProps = {
  open: false,
  audience: null,
}

export default AdminAudienceModal
