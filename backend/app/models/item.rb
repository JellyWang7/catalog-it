class Item < ApplicationRecord
  belongs_to :list
  
  validates :name, presence: true
  validates :rating, numericality: { 
    greater_than_or_equal_to: 1, 
    less_than_or_equal_to: 5,
    only_integer: true
  }, allow_nil: true
  
  validate :date_added_after_list_creation
  before_validation :sanitize_notes
  
  scope :by_category, ->(category) { where(category: category) }
  
  private
  
  def sanitize_notes
    if notes.present?
      # Allow basic formatting but strip dangerous HTML/JavaScript
      self.notes = Sanitize.fragment(notes, Sanitize::Config::BASIC)
    end
  end
  
  def date_added_after_list_creation
    if list && created_at && list.created_at
      if created_at < list.created_at
        errors.add(:created_at, "cannot be before the list was created")
      end
    end
  end
end
