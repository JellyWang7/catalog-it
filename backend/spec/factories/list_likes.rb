FactoryBot.define do
  factory :list_like do
    association :user
    association :list
  end
end
