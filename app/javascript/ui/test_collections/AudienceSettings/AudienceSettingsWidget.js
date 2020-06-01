import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import { DisplayTextCss } from '~/ui/global/styled/typography'
import v, { EVENT_SOURCE_TYPES } from '~/utils/variables'
import { calculatePopoutMenuOffset } from '~/utils/clickUtils'
import {
  StyledRowFlexItem,
  AudienceRowCell,
  StyledRowFlexParent,
  StyledColumnFlexParent,
} from './styled'
import TableHeader from './TableHeader'
import TableBody from './TableBody'
import AudienceCheckbox from './AudienceCheckbox'
import AddAudienceModal from './AddAudienceModal'
import AdminAudienceModal from '~/ui/admin/AdminAudienceModal.js'
import Button from '~shared/components/atoms/Button'
import PlusIcon from '~/ui/icons/PlusIcon'
import GlobeIcon from '~/ui/icons/GlobeIcon'
import InfoIcon from '~/ui/icons/InfoIcon'
import PopoutMenu from '~/ui/global/PopoutMenu'
import ClickWrapper from '~/ui/layout/ClickWrapper'

const AudienceSettingsWrapper = styled.div`
  width: 100%;
  max-width: 500px;
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    max-width: 350px;
  }
  ${DisplayTextCss};
`

const DesktopWrapper = styled.div`
  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`

const MobileWrapper = styled.div`
  @media only screen and (min-width: ${v.responsive.medBreakpoint}px) {
    display: none;
  }
`

const AddAudienceButton = styled(Button)`
  z-index: ${v.zIndex.aboveClickWrapper};
`

const AddAudienceMenu = styled.span`
  .icon {
    left: 0;
    line-height: 2.4rem !important;
    margin-right: 8px;
    position: relative !important;
    vertical-align: middle;
  }
`

const StyledPlusIcon = styled.span`
  height: 15px;
  margin-right: 8px;
  width: 15px;
`

const StyledNewAudienceButton = styled.span`
  text-transform: uppercase;
  font-family: ${v.fonts.sans};
  font-size: 0.875rem;
  font-weight: ${v.weights.medium};
`

const StyledInfoIconWrapper = styled.span`
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
`

@inject('uiStore')
@observer
class AudienceSettingsWidget extends React.Component {
  state = {
    addAudienceMenuOpen: false,
    addAudienceModalOpen: false,
    popoutMenuOffsetPosition: null,
    selectedAudienceMenuItem: null,
  }

  get hidePaidAudienceSettings() {
    const { uiStore } = this.props

    return uiStore.viewingRecord.isInsideAChallenge
  }

  get displayedAudiences() {
    const { audiences, audienceSettings } = this.props
    return _.sortBy(
      _.filter(audiences, a => {
        const setting = audienceSettings.get(a.id)
        return setting && setting.displayCheckbox
      }),
      'order'
    )
  }

  toggleAddAudienceMenu = e => {
    const menuItems = this.addAudienceMenuItems()
    const menuItemCount = menuItems && menuItems.length ? menuItems.length : 1
    const { offsetX } = calculatePopoutMenuOffset(
      e,
      EVENT_SOURCE_TYPES.AUDIENCE_SETTINGS,
      menuItemCount
    )

    this.setState({
      addAudienceMenuOpen: !this.state.addAudienceMenuOpen,
      popoutMenuOffsetPosition: { x: offsetX, y: -20 },
    })
  }

  closeAddAudienceMenu = () => {
    this.setState({ addAudienceMenuOpen: false })
  }

  openAddAudienceModal = () => {
    this.closeAddAudienceMenu()
    this.setState({ addAudienceModalOpen: true })
  }

  closeAddAudienceModal = () => {
    this.setState({ addAudienceModalOpen: false })
  }

  openAudienceMenu = audience => {
    const { uiStore } = this.props
    this.setState({ selectedAudienceMenuItem: audience })
    uiStore.update('feedbackAudienceMenuOpen', true)
  }

  audiencesInMenu() {
    const { audiences } = this.props
    const { displayedAudiences } = this
    const unselectedAudiences = _.filter(
      audiences,
      a => !_.includes(displayedAudiences, a)
    )
    return _.sortBy(unselectedAudiences, a => a.order)
  }

  addAudienceMenuItems() {
    const orgAudiences = this.audiencesInMenu()
    const audienceItems = orgAudiences.map(audience => {
      const { name, global } = audience
      return {
        name,
        iconLeft: global ? <GlobeIcon /> : null,
        iconRight: (
          <StyledInfoIconWrapper
            onClick={() => {
              this.openAudienceMenu(audience)
            }}
            className="infoIcon"
          >
            <InfoIcon />
          </StyledInfoIconWrapper>
        ),
        onClick: e => {
          if (e.target.closest('.infoIcon')) return
          this.closeAddAudienceMenu()
          this.addAudience(audience)
        },
      }
    })

    audienceItems.push({
      name: <StyledNewAudienceButton>New Audience</StyledNewAudienceButton>,
      iconLeft: <PlusIcon />,
      onClick: this.openAddAudienceModal,
    })

    return audienceItems
  }

  addAudience(audience) {
    const { afterAddAudience } = this.props
    if (afterAddAudience) {
      afterAddAudience(audience)
    }
  }

  isAudienceSelected(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings.get(audience.id)
    return option ? option.selected : false
  }

  sampleSize(audience) {
    const { audienceSettings } = this.props
    const option = audienceSettings.get(audience.id)
    return option && option.sample_size ? option.sample_size.toString() : ''
  }

  isAudienceLocked(audience) {
    const { locked } = this.props
    return !audience.isLinkSharing && locked
  }

  selectedAudienceHasCheckbox() {
    const { selectedAudienceMenuItem } = this.state
    const { displayedAudiences } = this
    return !_.includes(displayedAudiences, selectedAudienceMenuItem)
  }

  renderTableBody(audience) {
    const { onInputChange, numPaidQuestions } = this.props
    return (
      !this.hidePaidAudienceSettings && (
        <TableBody
          audience={audience}
          onInputChange={onInputChange}
          selected={this.isAudienceSelected(audience)}
          numPaidQuestions={numPaidQuestions}
          sampleSize={this.sampleSize(audience)}
          locked={this.isAudienceLocked(audience)}
        />
      )
    )
  }

  renderCheckbox(audience) {
    const { onToggleCheckbox } = this.props
    return (
      <AudienceCheckbox
        audience={audience}
        selected={this.isAudienceSelected(audience)}
        onToggleCheckbox={onToggleCheckbox}
        disabled={this.isAudienceLocked(audience)}
        openAudienceMenu={this.openAudienceMenu}
      />
    )
  }

  render() {
    const { totalPrice, locked } = this.props
    const { displayedAudiences } = this
    const { addAudienceMenuOpen, popoutMenuOffsetPosition } = this.state
    const { uiStore } = this.props

    let newAudienceButton = (
      <Flex align="center">
        <StyledRowFlexItem style={{ marginTop: '5px' }}>
          <AddAudienceButton onClick={this.toggleAddAudienceMenu}>
            <StyledPlusIcon>
              <PlusIcon />
            </StyledPlusIcon>
            Audience
          </AddAudienceButton>
          <AddAudienceMenu>
            <PopoutMenu
              width={280}
              wrapperClassName="add-audience-menu"
              menuOpen={addAudienceMenuOpen}
              menuItems={this.addAudienceMenuItems()}
              offsetPosition={popoutMenuOffsetPosition}
              hideDotMenu
              positionRelative
            />
          </AddAudienceMenu>
        </StyledRowFlexItem>
        {addAudienceMenuOpen && (
          <ClickWrapper clickHandlers={[this.closeAddAudienceMenu]} />
        )}
      </Flex>
    )
    if (locked) newAudienceButton = <div style={{ width: '250px' }} />

    const totalPriceDisplay = (
      <React.Fragment>
        <AudienceRowCell>Total</AudienceRowCell>
        <AudienceRowCell>
          <strong>{totalPrice}</strong>
        </AudienceRowCell>
      </React.Fragment>
    )

    const { addAudienceModalOpen, selectedAudienceMenuItem } = this.state

    return (
      <AudienceSettingsWrapper>
        <h3 style={{ marginBottom: '0px' }}>Audience</h3>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <MobileWrapper>
            <StyledColumnFlexParent>
              {displayedAudiences.map(audience => {
                return (
                  <StyledColumnFlexParent key={audience.id}>
                    {this.renderCheckbox(audience)}
                    {!this.hidePaidAudienceSettings && <TableHeader />}
                    {this.renderTableBody(audience)}
                  </StyledColumnFlexParent>
                )
              })}
              {!this.hidePaidAudienceSettings && (
                <StyledRowFlexParent style={{ marginTop: '15px' }}>
                  {newAudienceButton}
                  <AudienceRowCell />
                  {totalPriceDisplay}
                </StyledRowFlexParent>
              )}
            </StyledColumnFlexParent>
          </MobileWrapper>

          <DesktopWrapper>
            <StyledRowFlexParent column>
              <StyledRowFlexParent>
                <StyledRowFlexItem />
                {!this.hidePaidAudienceSettings && <TableHeader />}
              </StyledRowFlexParent>
              {displayedAudiences.map(audience => {
                return (
                  <StyledRowFlexParent key={audience.id}>
                    {this.renderCheckbox(audience)}
                    {this.renderTableBody(audience)}
                  </StyledRowFlexParent>
                )
              })}
              {!this.hidePaidAudienceSettings && (
                <StyledRowFlexParent>
                  {newAudienceButton}
                  <AudienceRowCell />
                  {totalPriceDisplay}
                </StyledRowFlexParent>
              )}
            </StyledRowFlexParent>
          </DesktopWrapper>

          <StyledColumnFlexParent />
        </div>
        <AddAudienceModal
          open={addAudienceModalOpen}
          close={this.closeAddAudienceModal}
          afterSave={audience => this.addAudience(audience)}
        />
        {uiStore.feedbackAudienceMenuOpen && (
          <AdminAudienceModal
            audience={selectedAudienceMenuItem}
            afterClose={audience => this.addAudience(audience)}
            showModalButton={this.selectedAudienceHasCheckbox()}
            open
          />
        )}
      </AudienceSettingsWrapper>
    )
  }
}

AudienceSettingsWidget.propTypes = {
  audiences: MobxPropTypes.arrayOrObservableArray.isRequired,
  audienceSettings: MobxPropTypes.objectOrObservableObject.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onToggleCheckbox: PropTypes.func.isRequired,
  afterAddAudience: PropTypes.func.isRequired,
  totalPrice: PropTypes.string.isRequired,
  numPaidQuestions: PropTypes.number.isRequired,
  locked: PropTypes.bool,
}

AudienceSettingsWidget.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

AudienceSettingsWidget.defaultProps = {
  locked: false,
}

export default AudienceSettingsWidget
