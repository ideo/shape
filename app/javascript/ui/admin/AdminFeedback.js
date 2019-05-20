import Grid from '@material-ui/core/Grid'
import moment from 'moment-mini'
import styled from 'styled-components'
import { Flex } from 'reflexbox'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
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

const LaunchState = styled.span`
  color: ${colors.confirmation};
`

const AudienceRowItem = styled(Grid)`
  padding-bottom: 0.5rem;
`

@inject('apiStore')
@observer
class AdminFeedback extends React.Component {
  state = {
    testCollections: [],
  }

  async componentDidMount() {
    const testCollections = await this.props.apiStore.fetchTestCollections()
    this.setState({ testCollections })
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
                  <Flex justify="flex-end">12</Flex>
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
    return (
      <Wrapper>
        <Heading1>Feedback</Heading1>
        <Section>
          <Heading2>All Shape Feedback</Heading2>
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
        </Section>
      </Wrapper>
    )
  }
}

AdminFeedback.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AdminFeedback
