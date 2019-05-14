class Dataset
  class NetworkAppMetric < Dataset
    def data
      DataReport::NetworkAppMetric.call(self)
    end
  end
end
