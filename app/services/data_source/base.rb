module DataSource
  class Base < SimpleService
    attr_accessor :context

    # All DataSources are expected to respond with our spec defined here:
    # https://github.com/ideo/shape/wiki/Data-Source-Spec

    def initialize(context)
      @context = context
    end

    def call
      {
        title: title,
        subtitle: subtitle,
        datasets: datasets,
        columns: columns,
        filters: filters,
      }
    end
  end
end
