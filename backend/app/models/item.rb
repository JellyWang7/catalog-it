class Item < ApplicationRecord
  belongs_to :list
  
  validates :name, presence: true
  validates :rating, inclusion: { in: 0..5 }, allow_nil: true
  
  scope :by_category, ->(category) { where(category: category) }
end
