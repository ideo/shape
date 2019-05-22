import ProductDescription from '~/ui/marketing/ProductDescription'
import marketingFirestoreClient from '~/vendor/firebase/sites/marketing'
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
    marketingFirestoreClient
      .getObjectFromCollection('productDescriptions')
      .then(productDescriptions => {
        const descriptionsToArray = Object.keys(productDescriptions).map(key =>
          Object.assign({ id: key }, productDescriptions[key])
        )
        this.setState({ products: descriptionsToArray }) // convert firestore collection object to iterable array
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
              imageUrl={p.imageUrl}
            />
          ))
        ) : (
          <span>-</span>
        )}
      </Content>
    )
  }
}

export default ProductDescriptions
