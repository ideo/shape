module Controller
  class FilteredIndexLoader < SimpleService
    def initialize(controller:, params:, page:, application: nil)
      @controller = controller
      @params = params
      @application = application
      @filter = params[:filter] || {}
      @page = page
      @errors = []
      @results = []
    end

    def call
      return error_422 if required_filters_not_present
      apply_filters
      return error_422 if @errors.present?
      load_controller_instance_variable
      @results
    end

    private

    def error_422
      @controller.head(:unprocessable_entity)
    end

    def controller_name
      @params[:controller].split('/').last
    end

    def klass
      controller_name.classify.safe_constantize
    end

    def required_filters_not_present
      # items and collections require a filter to process their index action
      @filter.empty? && %w[items collections].include?(controller_name)
    end

    def apply_filters
      return if @filter.empty?
      filter_external_id
    end

    def load_controller_instance_variable
      @controller.instance_variable_set(
        "@#{controller_name}", @results
      )
    end

    def filter_external_id
      return unless @filter[:external_id].present?
      unless @application.present?
        @errors << 'application required to filter by external_id'
        return false
      end
      @results = klass.where_external_id(
        @filter[:external_id],
        application_id: @application.id,
      ).page(@page)
    end
  end
end
