import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex } from 'reflexbox'

import { DisplayTextCss } from '~/ui/global/styled/typography'
import v from '~/utils/variables'
import {
  StyledRowFlexItem,
  StyledRowFlexCell,
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
  .menu-wrapper {
    left: 0;
    top: -35px;
  }

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

const StyledGlobeIcon = styled.span`
  float: left;
  display: ${props => (props.global ? 'inline' : 'none')};
`

const StyledInfoIcon = styled.span`
  float: right;
  display: ${props => (props.global ? 'inline' : 'none')};
`

@inject('uiStore')
@observer
class AudienceSettingsWidget extends React.Component {
  state = {
    addAudienceMenuOpen: false,
    addAudienceModalOpen: false,
    selectedAudienceMenuItem: null,
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

  toggleAddAudienceMenu = () => {
    this.setState({ addAudienceMenuOpen: !this.state.addAudienceMenuOpen })
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
        name: name,
        iconLeft: (
          <StyledGlobeIcon global={global}>
            <GlobeIcon />
          </StyledGlobeIcon>
        ),
        iconRight: (
          <StyledInfoIcon
            global={global}
            onClick={() => {
              this.openAudienceMenu(audience)
            }}
            className="infoIcon"
          >
            <InfoIcon />
          </StyledInfoIcon>
        ),
        onClick: e => {
          if (e.target.closest('.infoIcon')) return
          this.closeAddAudienceMenu()
          this.addAudience(audience)
        },
      }
    })

    audienceItems.push({
      name: 'New Audience',
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
    return audience.price_per_response > 0 && locked
  }

  selectedAudienceHasCheckbox() {
    const { selectedAudienceMenuItem } = this.state
    const { displayedAudiences } = this
    return !_.includes(displayedAudiences, selectedAudienceMenuItem)
  }

  renderTableBody(audience) {
    const { onInputChange } = this.props
    return (
      <TableBody
        audience={audience}
        onInputChange={onInputChange}
        selected={this.isAudienceSelected(audience)}
        sampleSize={this.sampleSize(audience)}
        locked={this.isAudienceLocked(audience)}
      />
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
    const { addAudienceMenuOpen } = this.state
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
              wrapperClassName="add-audience-menu"
              menuOpen={addAudienceMenuOpen}
              menuItems={this.addAudienceMenuItems()}
              hideDotMenu
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
        <StyledRowFlexCell>Total</StyledRowFlexCell>
        <StyledRowFlexCell>
          <strong>{totalPrice}</strong>
        </StyledRowFlexCell>
      </React.Fragment>
    )

    const { selectedAudienceMenuItem } = this.state

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
                    <TableHeader />
                    {this.renderTableBody(audience)}
                  </StyledColumnFlexParent>
                )
              })}
              <StyledRowFlexParent style={{ marginTop: '15px' }}>
                {newAudienceButton}
                <StyledRowFlexCell />
                {totalPriceDisplay}
              </StyledRowFlexParent>
            </StyledColumnFlexParent>
          </MobileWrapper>

          <DesktopWrapper>
            <StyledRowFlexParent column>
              <StyledRowFlexParent>
                <StyledRowFlexItem />
                <TableHeader />
              </StyledRowFlexParent>
              {displayedAudiences.map(audience => {
                return (
                  <StyledRowFlexParent key={audience.id}>
                    {this.renderCheckbox(audience)}
                    {this.renderTableBody(audience)}
                  </StyledRowFlexParent>
                )
              })}
              <StyledRowFlexParent>
                {newAudienceButton}
                <StyledRowFlexCell />
                {totalPriceDisplay}
              </StyledRowFlexParent>
            </StyledRowFlexParent>
          </DesktopWrapper>

          <StyledColumnFlexParent />
        </div>
        <AddAudienceModal
          open={this.state.addAudienceModalOpen}
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
  locked: PropTypes.bool,
}

AudienceSettingsWidget.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

AudienceSettingsWidget.defaultProps = {
  locked: false,
}

export default AudienceSettingsWidget
