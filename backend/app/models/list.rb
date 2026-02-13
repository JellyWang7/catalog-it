class List < ApplicationRecord
  belongs_to :user
  
  has_many :items, dependent: :destroy
  
  validates :title, presence: true
  validates :visibility, inclusion: { in: %w[public private shared] }
  
  before_validation :sanitize_description
  
  scope :public_lists, -> { where(visibility: 'public') }
  
  private
  
  def sanitize_description
    if description.present?
      # Allow basic formatting but strip dangerous HTML/JavaScript
      self.description = Sanitize.fragment(description, Sanitize::Config::BASIC)
    end
  end
end
