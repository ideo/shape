import Grid from '@material-ui/core/Grid'
import moment from 'moment-mini'
import styled from 'styled-components'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Flex } from 'reflexbox'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import AdminNewQueryModal from './AdminNewQueryModal'
import AdminNewQueryRow from './AdminNewQueryRow'
import { uiStore } from '~/stores'
import Box from '~shared/components/atoms/Box'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import LeftButtonIcon from '~/ui/icons/LeftButtonIcon'
import IconAvatar from '~/ui/global/IconAvatar'
import LinkIcon from '~/ui/icons/LinkIcon'
import SearchLargeIcon from '~/ui/icons/SearchLargeIcon'
import DownloadIcon from '~/ui/icons/DownloadIcon'
import Section from '~shared/components/molecules/Section'
import v from '~/utils/variables'
import { Heading1, Heading2, Heading3 } from '~/ui/global/styled/typography'
import Tooltip from '~/ui/global/Tooltip'
import * as colors from '~shared/styles/constants/colors'
import InfoNoCircleIcon from '~/ui/icons/InfoNoCircleIcon'
import AdminAudienceModal from '~/ui/admin/AdminAudienceModal'
import { showOnHoverCss } from '~/ui/grid/shared'

const Wrapper = styled.div`
  font-family: ${v.fonts.sans};
  min-width: ${v.responsive.largeBreakpoint}px;
  // allow horizontal scrolling for grid layout
`

const SubHeading = styled.div`
  color: ${v.colors.commonDark};
  font-size: 0.75rem;
  line-height: 1rem;
`

const SubHeadingRight = styled(SubHeading)`
  text-align: right;
`

const FeedbackRow = styled(Grid)`
  padding: 1rem 0;
`
FeedbackRow.displayName = 'FeedbackRow'

const LaunchState = styled.span`
  color: ${colors.confirmation};
`

const AudienceRowItem = styled(Grid)`
  padding-bottom: 0.5rem;
`
AudienceRowItem.displayName = 'AudienceRowItem'

const SizedIcon = styled.div`
  height: 20px;
  width: 20px;
`

const AudienceWrapper = styled(Flex)`
  ${showOnHoverCss};
  position: relative;
  top: -0.5rem;
  /*
    adjust upward, so audience name is plumb with the rest of the row's
    contents. the AudienceAction buttons had the effect of pushing the
    audience name down.
  */
`

const PaginationWrapper = styled.div`
  background-color: ${v.colors.commonDark};
  border-radius: 1px;
  color: ${v.colors.white};
  height: 60px;
  letter-spacing: 1.6px;
  line-height: 60px;
  margin: 0 1rem;
  width: 60px;
  text-align: center;
`
PaginationWrapper.displayName = 'PaginationWrapper'

const PaginationButton = styled.button`
  color: ${v.colors.commonDark};
  height: 35px;
  width: 35px;

  &:disabled {
    color: ${v.colors.commonLight};
  }
`
PaginationButton.displayName = 'PaginationButton'

const NextPageButton = styled(PaginationButton)`
  svg {
    transform: scale(-1, 1);
  }
`
NextPageButton.displayName = 'NextPageButton'

const ExportIncentivesButton = styled(Heading3)`
  cursor: pointer;
  display: inline-block;
  .icon {
    width: 26px;
    height: 26px;
    margin-right: 7px;
    vertical-align: middle;
  }
`

@inject('apiStore', 'uiStore')
@observer
class AdminFeedback extends React.Component {
  state = {
    testCollections: [],
    currentPage: 1,
    totalPages: 1,
    newQueryModalOpen: false,
    newQueryResponseCount: null,
    newQueryRowVisible: false,
    selectedCollection: null,
  }

  componentDidMount() {
    this.loadTestCollections(this.state.currentPage)
  }

  async loadTestCollections(page) {
    const testCollections = await this.props.apiStore.fetchTestCollections(page)
    this.setState({
      testCollections: testCollections.data,
      currentPage: page,
      totalPages: testCollections.totalPages,
    })
  }

  handleDownloadFeedbackIncentives = () => {
    window.location.href = '/api/v1/admin/feedback_incentives.csv'
    uiStore.popupSnackbar({
      message: 'All incentives marked as paid!',
    })
    return false
  }

  loadPreviousPage() {
    this.loadTestCollections(this.state.currentPage - 1)
  }

  loadNextPage() {
    this.loadTestCollections(this.state.currentPage + 1)
  }

  openNewQueryModal(newQueryResponseCount) {
    this.setState({
      newQueryModalOpen: true,
      newQueryResponseCount,
    })
  }

  closeNewQueryModal() {
    this.setState({ newQueryModalOpen: false })
  }

  showNewQueryRow(collection) {
    this.setState({
      newQueryRowVisible: true,
      selectedCollection: collection,
    })
  }

  hideNewQueryRow() {
    this.setState({ newQueryRowVisible: false })
  }

  showAdminAudienceDialog = collection => {
    const { uiStore } = this.props
    this.setState({ selectedCollection: collection })
    uiStore.update('adminAudienceMenuOpen', true)
  }

  renderTestCollections() {
    return this.state.testCollections.map(testCollection => (
      <React.Fragment key={testCollection.id}>
        <FeedbackRow container>
          <Grid item xs={2}>
            {testCollection.name}
          </Grid>
          <Grid item xs={1}>
            <LaunchState>Launched</LaunchState>
          </Grid>
          <Grid item xs={2}>
            {testCollection.test_launched_at
              ? moment(testCollection.test_launched_at).format('L LT')
              : null}
          </Grid>
          <Grid item xs={2}>
            {testCollection.test_launched_at
              ? moment(testCollection.test_launched_at).fromNow(true)
              : null}
          </Grid>
          <Grid container item xs={5}>
            {testCollection.test_audiences.map(testCollection => {
              const editingQuery =
                this.state.newQueryRowVisible &&
                this.state.selectedCollection &&
                testCollection.id === this.state.selectedCollection.id

              const audienceNameStyle = editingQuery
                ? { borderBottom: `1px solid ${v.colors.black}` }
                : undefined

              return (
                <React.Fragment key={testCollection.id}>
                  <AudienceRowItem item xs={5}>
                    <AudienceWrapper align="center">
                      <div style={audienceNameStyle}>
                        {testCollection.audience.name}
                      </div>
                      <Flex className="show-on-hover">
                        <IconAvatar
                          color={v.colors.black}
                          backgroundColor={v.colors.commonLight}
                          data-cy="NewQueryButton"
                          title="start new query"
                          onClick={() => this.showNewQueryRow(testCollection)}
                        >
                          <SearchLargeIcon />
                        </IconAvatar>
                        <CopyToClipboard
                          text={`${testCollection.publicTestURL}?ta=${testCollection.id}`}
                          onCopy={() =>
                            this.props.uiStore.popupSnackbar({
                              message: 'Survey link copied',
                            })
                          }
                        >
                          <IconAvatar
                            color={v.colors.black}
                            backgroundColor={v.colors.commonLight}
                            title="copy survey link"
                          >
                            <SizedIcon>
                              <LinkIcon />
                            </SizedIcon>
                          </IconAvatar>
                        </CopyToClipboard>
                        <Tooltip
                          classes={{ tooltip: 'Tooltip' }}
                          title={'view audience definition'}
                          placement="top"
                        >
                          <IconAvatar
                            color={v.colors.black}
                            backgroundColor={v.colors.commonLight}
                            data-cy="AudienceInfoButton"
                            onClick={() => {
                              this.showAdminAudienceDialog(testCollection)
                            }}
                          >
                            <SizedIcon>
                              <InfoNoCircleIcon />
                            </SizedIcon>
                          </IconAvatar>
                        </Tooltip>
                      </Flex>
                    </AudienceWrapper>
                  </AudienceRowItem>
                  <AudienceRowItem item xs={2}>
                    <Flex justify="flex-end">{testCollection.sample_size}</Flex>
                  </AudienceRowItem>
                  <AudienceRowItem item xs={3}>
                    <Flex justify="flex-end">0</Flex>
                  </AudienceRowItem>
                  <AudienceRowItem item xs={2}>
                    <Flex justify="flex-end">
                      {testCollection.num_survey_responses}
                    </Flex>
                  </AudienceRowItem>
                  {editingQuery && (
                    <AdminNewQueryRow
                      openNewQueryModal={count => this.openNewQueryModal(count)}
                      hideNewQueryRow={() => this.hideNewQueryRow()}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </Grid>
        </FeedbackRow>
        <Grid container>
          <Grid item xs={12}>
            <HorizontalDivider />
          </Grid>
        </Grid>
      </React.Fragment>
    ))
  }

  render() {
    const {
      currentPage,
      totalPages,
      selectedCollection,
      newQueryModalOpen,
      newQueryResponseCount,
    } = this.state
    const previousPageDisabled = currentPage === 1
    const nextPageDisabled = currentPage === totalPages
    const { uiStore } = this.props

    return (
      <Wrapper>
        {uiStore.adminAudienceMenuOpen && (
          <AdminAudienceModal audience={selectedCollection.audience} open />
        )}
        <Heading1>Feedback</Heading1>
        <Section>
          <Grid container>
            <Grid item xs={6}>
              <Box mb={40}>
                <Heading2 data-cy="AdminHeader">All Shape Feedback</Heading2>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Flex justify="flex-end">
                <ExportIncentivesButton
                  onClick={this.handleDownloadFeedbackIncentives}
                >
                  <DownloadIcon />
                  Export Pending Incentives
                </ExportIncentivesButton>
              </Flex>
            </Grid>
          </Grid>
          <Grid container>
            <Grid data-cy="AdminRowHeaderWrapper" container>
              <Grid item xs={2}>
                <Heading3>Test Name</Heading3>
              </Grid>
              <Grid item xs={1}>
                <Heading3>State</Heading3>
              </Grid>
              <Grid item xs={2}>
                <Heading3>Time Initiated</Heading3>
              </Grid>
              <Grid item xs={2}>
                <Heading3>Time Elapsed</Heading3>
              </Grid>
              <Grid item xs={5}>
                <Flex column>
                  <Heading3>Audience(s)</Heading3>
                  <Grid container>
                    <Grid item xs={5}>
                      <SubHeading>Audience Name</SubHeading>
                    </Grid>
                    <Grid item xs={2}>
                      <SubHeadingRight>n Requested</SubHeadingRight>
                    </Grid>
                    <Grid item xs={3}>
                      <SubHeadingRight>Sourced from INA</SubHeadingRight>
                    </Grid>
                    <Grid item xs={2}>
                      <SubHeadingRight>Completed</SubHeadingRight>
                    </Grid>
                  </Grid>
                </Flex>
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs={12}>
                <HorizontalDivider />
              </Grid>
            </Grid>
            {this.renderTestCollections()}
          </Grid>
          {totalPages > 1 && (
            <Grid container>
              <Grid item xs={12}>
                <Flex align="center" justify="center" mt={3}>
                  <PaginationButton
                    disabled={previousPageDisabled}
                    onClick={() => this.loadPreviousPage()}
                  >
                    <LeftButtonIcon disabled={previousPageDisabled} />
                  </PaginationButton>
                  <PaginationWrapper>
                    {currentPage}/{totalPages}
                  </PaginationWrapper>
                  <NextPageButton
                    disabled={nextPageDisabled}
                    onClick={() => this.loadNextPage()}
                  >
                    <LeftButtonIcon disabled={nextPageDisabled} />
                  </NextPageButton>
                </Flex>
              </Grid>
            </Grid>
          )}
        </Section>
        {newQueryModalOpen && (
          <AdminNewQueryModal
            open
            close={() => this.closeNewQueryModal()}
            audience={selectedCollection.audience}
            responseCount={newQueryResponseCount}
          />
        )}
      </Wrapper>
    )
  }
}

AdminFeedback.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminFeedback
