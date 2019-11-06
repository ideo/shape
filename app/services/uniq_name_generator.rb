# generate unique names for survey aliases
class UniqNameGenerator < SimpleService
  def initialize(disallowed_names:)
    @disallowed_names = disallowed_names
  end

  def call
    find_uniq_name
  end

  def find_uniq_name
    name = ''
    total_tries = @disallowed_names.count
    try = 0
    while try < total_tries
      try += 1
      name = Faker::Name.first_name
      next if @disallowed_names.include?(name)

      break
    end
    name
  end
end
