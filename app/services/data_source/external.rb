module DataSource
  class External < Base
    def call
      # Query external data source
      http_response = HTTParty.get(item.url)
      if success_http_status_codes.include?(http_response.code)
        @attributes = http_response.body['data']['attributes']
      else
        handle_error
      end
      response
    rescue HTTParty::Error
      handle_error
      response
    end

    def response
      {
        title: @attributes['title'] || '',
        subtitle: @attributes['subtitle'] || '',
        datasets: @attributes['datasets'] || [],
        columns: @attributes['columns'] || [],
        filters: @attributes['filters'] || [],
      }
    end

    private

    def handle_error
      @attributes = {
        'title' => 'Could not load data',
      }
    end

    def item
      context[:item]
    end

    def success_http_status_codes
      [200, 304]
    end
  end
end
