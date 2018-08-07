// some inspiration taken from https://github.com/nzambello/react-csv-reader
import PropTypes from 'prop-types'
import Papa from 'papaparse'
import styled from 'styled-components'
import UploadIcon from '~/ui/icons/UploadIcon'
import v from '~/utils/variables'

const StyledUploader = styled.div`
  height: 20px;
  font-size: 0.8rem;
  color: ${v.colors.gray};
  font-family: ${v.fonts.sans};
  .icon {
    width: 20px;
    margin-right: 8px;
  }
  label {
    display: flex;
    align-items: flex-start;
  }
  input {
    display: none;
  }
`

class CSVUploader extends React.Component {
  state = {
    fileInputValue: '',
  }

  handleFileUpload = e => {
    if (!e.target.files) return
    const { onFileLoaded } = this.props
    const reader = new FileReader()
    const filename = e.target.files[0].name

    reader.onload = event => {
      const csvData = Papa.parse(event.target.result, {
        error: err => console.warn('csv parse error', err)
      })
      onFileLoaded(csvData.data, filename)
    }
    reader.readAsText(e.target.files[0])
    // clear out input
    this.setState({ fileInputValue: '' })
  }

  render() {
    return (
      <StyledUploader>
        <label htmlFor="csv-upload">
          <UploadIcon />
          <span>
            Upload .CSV
          </span>
        </label>
        <input
          type="file"
          id="csv-upload"
          accept="text/csv"
          value={this.state.fileInputValue}
          onChange={this.handleFileUpload}
        />
      </StyledUploader>

    )
  }
}

CSVUploader.propTypes = {
  onFileLoaded: PropTypes.func.isRequired,
}

export default CSVUploader
