import ProductDescription from '~/ui/marketing/ProductDescription'
import marketingFirebaseClient from '~/vendor/firebase/clients/marketingFirebaseClient'
import styled from 'styled-components'
import v from '~/utils/variables'

const Content = styled.div`
  color: black;
  letter-spacing: -0.2px;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`

class ProductDescriptions extends React.PureComponent {
  constructor() {
    super()
    this.state = { products: [] }
  }

  componentDidMount() {
    marketingFirebaseClient
      .getObjectFromCollection('productDescriptions')
      .then(productDescriptions => {
        this.setState({ products: productDescriptions })
      })
  }

  render() {
    const { products } = this.state
    return (
      <Content>
        {products && products.length > 0 ? (
          products.map(p => (
            <ProductDescription
              key={p.id}
              id={p.id}
              order={p.order}
              title={p.title}
              description={p.description}
              descriptionMarkdown={p.descriptionMarkdown}
              descriptionHTML={p.descriptionHTML}
              imageUrl={p.imageUrl}
            />
          ))
        ) : (
          <div />
        )}
      </Content>
    )
  }
}

export default ProductDescriptions
