FactoryBot.define do
  factory :item do
    name { Faker::Commerce.product_name }
    category { Faker::Commerce.department }
    notes { Faker::Lorem.sentence }
    rating { rand(0..5) }
    association :list

    trait :unrated do
      rating { nil }
    end

    trait :highly_rated do
      rating { 5 }
    end
  end
end
