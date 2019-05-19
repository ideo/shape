import Grid from '@material-ui/core/Grid'
import styled from 'styled-components'
import { Flex } from 'reflexbox'

import HorizontalDivider from '~shared/components/atoms/HorizontalDivider'
import Section from '~shared/components/molecules/Section'
import v from '~/utils/variables'
import { Heading1, Heading2, Heading3 } from '~/ui/global/styled/typography'

const Wrapper = styled.div`
  font-family: ${v.fonts.sans};
`

const SubHeadingWrapper = styled(Flex)`
  height: 100%;
`

const SubHeading = styled.div`
  color: ${v.colors.commonDark};
  font-size: 0.75rem;
  line-height: 1rem;
`

class AdminFeedback extends React.Component {
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
                <SubHeadingWrapper column justify="flex-end">
                  <SubHeading>Complete Responses</SubHeading>
                </SubHeadingWrapper>
              </Grid>
              <Grid item xs={2}>
                <SubHeadingWrapper column justify="flex-end">
                  <SubHeading>Total Requested</SubHeading>
                </SubHeadingWrapper>
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs={12}>
                <HorizontalDivider />
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs={2}>
                CoinBase
              </Grid>
              <Grid item xs={2}>
                Launched
              </Grid>
              <Grid item xs={2}>
                0days 0hrs 5mins
              </Grid>
              <Grid item xs={2}>
                Anybody
              </Grid>
              <Grid item xs={2}>
                12
              </Grid>
              <Grid item xs={2}>
                12
              </Grid>
            </Grid>
          </Grid>
        </Section>
      </Wrapper>
    )
  }
}

export default AdminFeedback
