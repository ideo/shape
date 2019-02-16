module Controller
  class FilteredIndexLoader < SimpleService
    def initialize(controller:, params:, page:, application: nil)
      @controller = controller
      @params = params
      @application = application
      @filter = params[:filter] || {}
      @page = page
      @errors = []
    end

    def call
      init_results
      return error_422 if required_filters_not_present
      apply_filters
      return error_422 if @errors.present?
      load_controller_instance_variable
      @results
    end

    private

    def init_results
      # if the controller had already set something like "@organizations"
      # that will still get returned if no filters are applied
      @results = @controller.instance_variable_get("@#{controller_name}") || []
    end

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
      filter_parent_id
      @results.page(@page)
    end

    def load_controller_instance_variable
      @controller.instance_variable_set(
        "@#{controller_name}", @results
      )
    end

    def filter_external_id
      return if @filter[:external_id].blank?
      unless @application.present?
        @errors << 'application required to filter by external_id'
        return false
      end
      @results = klass.where_external_id(
        @filter[:external_id],
        application_id: @application.id,
      )
    end

    def filter_parent_id
      return if @filter[:parent_id].blank?
      @results = klass.where(
        parent_id: @filter[:parent_id],
      )
    end
  end
end
