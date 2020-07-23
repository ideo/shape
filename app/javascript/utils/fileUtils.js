import Papa from 'papaparse'

const loadCSVFile = (file, callback) => {
  if (!file) return
  const reader = new FileReader()
  const filename = file.name

  reader.onload = event => {
    const csvData = Papa.parse(event.target.result, {
      error: err => console.warn('csv parse error', err),
    })
    callback(csvData.data, filename)
  }
  reader.readAsText(file)
}

export { loadCSVFile }
