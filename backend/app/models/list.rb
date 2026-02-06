class List < ApplicationRecord
  belongs_to :user
  
  has_many :items, dependent: :destroy
  
  validates :title, presence: true
  validates :visibility, inclusion: { in: %w[public private shared] }
  
  scope :public_lists, -> { where(visibility: 'public') }
end
