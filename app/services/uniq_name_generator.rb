
class UniqNameGenerator < SimpleService

  def initialize(disallowed_names:)
    @disallowed_names = disallowed_names
  end

  def call
    find_uniq_name
  end

  def find_uniq_name
    name = ''
    total_trys = 2400
    try=  0
    while try < total_trys
      try += 1
      name = Faker::Name.first_name
      if @disallowed_names.include?(name)
        next
      end
      return name
    end
  end
end
