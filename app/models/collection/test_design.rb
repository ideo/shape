class Collection
  class TestDesign < Collection
    delegate :test_status, to: :parent
  end
end
