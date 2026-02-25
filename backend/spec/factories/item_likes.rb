FactoryBot.define do
  factory :item_like do
    association :user
    association :item
  end
end
