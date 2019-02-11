module DataSource
  class Base < SimpleService
    attr_accessor :context

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
