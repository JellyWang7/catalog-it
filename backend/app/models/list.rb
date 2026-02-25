class List < ApplicationRecord
  belongs_to :user
  
  has_many :items, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :list_likes, dependent: :destroy
  
  validates :title, presence: true
  validates :visibility, inclusion: { in: %w[public private shared] }
  validates :share_code, uniqueness: true, allow_nil: true
  
  before_validation :sanitize_description
  
  scope :public_lists, -> { where(visibility: 'public') }
  
  # Generate a unique short share code (8 characters)
  def generate_share_code!
    loop do
      self.share_code = SecureRandom.urlsafe_base64(6) # ~8 chars
      break unless List.exists?(share_code: share_code)
    end
    save!
    share_code
  end

  def likes_count
    list_likes.count
  end

  def liked_by?(user)
    return false unless user

    list_likes.exists?(user_id: user.id)
  end
  
  private
  
  def sanitize_description
    if description.present?
      # Allow basic formatting but strip dangerous HTML/JavaScript
      self.description = Sanitize.fragment(description, Sanitize::Config::BASIC)
    end
  end
end
