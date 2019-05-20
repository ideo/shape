# NOTE: if audiences are free, will not really "purchase" but just create
class TestAudiencePurchaser < SimpleService
  attr_reader :total_price

  def initialize(test_collection, test_audience_params)
    @test_collection = test_collection
    @test_audience_params = test_audience_params
    @total_price = 0
  end

  def call
    if build_test_audiences
      charge_payment_and_create_test_audiences
    end
    @test_collection
  end

  private

  def build_test_audiences
    @test_audience_params.each do |id, settings|
      next unless settings[:selected]
      audience = Audience.find(id)
      sample_size = settings[:sample_size].to_i
      # skip any TestAudience for audiences that cost money, where no sample_size was indicated
      next if audience.price_per_response.positive? && sample_size.zero?
      @test_collection.test_audiences.build(
        sample_size: sample_size,
        price_per_response: audience.price_per_response,
        audience_id: audience.id,
      )
      @total_price += sample_size * audience.price_per_response
    rescue ActiveRecord::RecordNotFound
      @test_collection.errors.add(:test_audiences, 'audience not found')
    end
    @test_collection.errors.empty?
  end

  def charge_payment_and_create_test_audiences
    # error case, requires at least one audience e.g. link sharing
    if @test_collection.test_audiences.empty?
      @test_collection.errors.add(:test_audiences, 'required')
      return
    end
    if @total_price.positive?
      # TODO: Hook up payment with org credit card
      # and add errors if it didn't work
    end
    # save will create the test_audiences built earlier
    @test_collection.save
  end
end
