FactoryBot.define do
  factory :comment do
    body { "Great list, thanks for sharing." }
    association :user
    association :list
  end
end
