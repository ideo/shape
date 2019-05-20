import Grid from '@material-ui/core/Grid'
import moment from 'moment-mini'
import styled from 'styled-components'
import { Flex } from 'reflexbox'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Box from '~shared/components/atoms/Box'
import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import LeftButtonIcon from '~/ui/icons/LeftButtonIcon'
import Section from '~shared/components/molecules/Section'
import v from '~/utils/variables'
import { Heading1, Heading2, Heading3 } from '~/ui/global/styled/typography'
import * as colors from '~shared/styles/constants/colors'

const Wrapper = styled.div`
  font-family: ${v.fonts.sans};
`

const SubHeadingWrapper = styled(Flex)`
  align-items: flex-end;
  flex-direction: column;
  height: 100%;
  justify-content: flex-end;
`

const SubHeading = styled.div`
  color: ${v.colors.commonDark};
  font-size: 0.75rem;
  line-height: 1rem;
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

@inject('apiStore')
@observer
class AdminFeedback extends React.Component {
  state = {
    testCollections: [],
    currentPage: 1,
    totalPages: 1,
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

  loadPreviousPage() {
    this.loadTestCollections(this.state.currentPage - 1)
  }

  loadNextPage() {
    this.loadTestCollections(this.state.currentPage + 1)
  }

  renderTestCollections() {
    return this.state.testCollections.map(testCollection => (
      <React.Fragment key={testCollection.id}>
        <FeedbackRow container>
          <Grid item xs={2}>
            {testCollection.name}
          </Grid>
          <Grid item xs={2}>
            <LaunchState>Launched</LaunchState>
          </Grid>
          <Grid item xs={2}>
            {testCollection.test_launched_at
              ? moment(testCollection.test_launched_at).fromNow(true)
              : null}
          </Grid>
          <Grid container item xs={6}>
            {testCollection.test_audiences.map(testAudience => (
              <React.Fragment key={testAudience.id}>
                <AudienceRowItem item xs={4}>
                  {testAudience.audience.name}
                </AudienceRowItem>
                <AudienceRowItem item xs={4}>
                  <Flex justify="flex-end">
                    {testCollection.num_survey_responses}
                  </Flex>
                </AudienceRowItem>
                <AudienceRowItem item xs={4}>
                  <Flex justify="flex-end">{testAudience.sample_size}</Flex>
                </AudienceRowItem>
              </React.Fragment>
            ))}
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
    const { currentPage, totalPages } = this.state
    const previousPageDisabled = currentPage === 1
    const nextPageDisabled = currentPage === totalPages

    return (
      <Wrapper>
        <Heading1>Feedback</Heading1>
        <Section>
          <Box mb={40}>
            <Heading2>All Shape Feedback</Heading2>
          </Box>
          <Grid container>
            <Grid container>
              <Grid item xs={2}>
                <Heading3>Test Name</Heading3>
              </Grid>
              <Grid item xs={2}>
                <Heading3>Launch State</Heading3>
              </Grid>
              <Grid item xs={2}>
                <Heading3>Time Since Launch</Heading3>
              </Grid>
              <Grid item xs={2}>
                <Flex column>
                  <Heading3>Audience(s)</Heading3>
                  <SubHeading>Audience Name</SubHeading>
                </Flex>
              </Grid>
              <Grid item xs={2}>
                <SubHeadingWrapper>
                  <SubHeading>Complete Responses</SubHeading>
                </SubHeadingWrapper>
              </Grid>
              <Grid item xs={2}>
                <SubHeadingWrapper>
                  <SubHeading>Total Requested</SubHeading>
                </SubHeadingWrapper>
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
      </Wrapper>
    )
  }
}

AdminFeedback.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminFeedback
