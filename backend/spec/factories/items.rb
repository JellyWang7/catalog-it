FactoryBot.define do
  factory :item do
    name { Faker::Commerce.product_name }
    category { Faker::Commerce.department }
    notes { Faker::Lorem.sentence }
    rating { rand(1..5) }  # Business rule: Rating must be between 1.0 and 5.0
    association :list

    trait :unrated do
      rating { nil }
    end

    trait :highly_rated do
      rating { 5 }
    end
    
    trait :low_rated do
      rating { 1 }
    end
  end
end
