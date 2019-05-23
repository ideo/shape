import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Box } from 'reflexbox'
import {
  MarketingContent,
  MarketingH1Bold,
  MarketingFlex,
} from '~/ui/global/styled/marketing.js'
import v from '~/utils/variables'

const StyledProductTemplate = styled(MarketingContent)`
  margin-left: 24px;
  margin-right: 24px;
  padding-top: 0px;
  padding-bottom: 0px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    margin-left: 0px;
    margin-right: 0px;
    padding-top: 36px;
    padding-bottom: 24px;
  }
`

const Title = styled(MarketingH1Bold)`
  text-transform: none;
  text-align: left;
  word-wrap: break-word;
  line-height: 30px;
  margin-bottom: 16px;

  @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
    line-height: 40px;
  }
`
// const Description = styled(MarketingContent)`
//   text-align: left;
//   word-wrap: break-word;
//   line-height: 25px;
//   font-size: 18px;
//
//   @media only screen and (min-width: ${v.responsive.smallBreakpoint}px) {
//     line-height: 1.4em;
//     font-size: 1.1em;
//   }
// `

const StyledInnerHTML = styled.div`
  text-align: left;
  word-wrap: break-word;
  line-height: 25px;
  font-size: 18px;
`
StyledInnerHTML.displayName = 'StyledInnerHTML'

// const StyledMarkdown = styled(ReactMarkdown)`
//   text-align: left;
//   word-wrap: break-word;
//   line-height: 25px;
//   font-size: 18px;
// `
// StyledMarkdown.displayName = 'StyledMarkdown'

const ImageDisplay = styled.img`
  object-fit: scale-down;
  max-width: 100%;
  max-height: 100%;
  height: auto;
  box-shadow: 0px 2px 16px ${v.colors.commonMedium};
`

class ProductTemplate extends React.PureComponent {
  render() {
    return (
      <StyledProductTemplate id={this.props.id} order={this.props.order}>
        <MarketingFlex
          w={1}
          mt={4}
          mb={4}
          align={[
            'flex-start',
            this.props.order % 2 === 1 ? 'flex-start' : 'flex-end',
          ]}
          justify="space-evenly"
          wrap
        >
          <Box w={[null, 0.08]} order={1} />

          <Box w={[1, 0.21]} order={[4, this.props.order % 2 === 1 ? 2 : 4]}>
            <Title>{this.props.title}</Title>
            <StyledInnerHTML
              dangerouslySetInnerHTML={{ __html: this.props.descriptionHTML }}
            />
          </Box>

          <Box w={[null, 0.09]} order={3} />

          <Box w={[1, 0.54]} order={[2, this.props.order % 2 === 1 ? 4 : 2]}>
            <ImageDisplay src={this.props.imageUrl} alt={this.props.title} />
          </Box>

          <Box w={[null, 0.08]} order={4} />
        </MarketingFlex>
      </StyledProductTemplate>
    )
  }
}

ProductTemplate.propTypes = {
  id: PropTypes.string.isRequired,
  order: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  descriptionMarkdown: PropTypes.string,
  descriptionHTML: PropTypes.string,
  imageUrl: PropTypes.string.isRequired,
}

ProductTemplate.defaultProps = {
  description: '',
  descriptionMarkdown: '',
  descriptionHTML: '',
}

export default ProductTemplate
