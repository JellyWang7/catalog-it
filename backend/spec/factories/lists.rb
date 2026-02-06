FactoryBot.define do
  factory :list do
    title { Faker::Lorem.sentence(word_count: 3) }
    description { Faker::Lorem.paragraph }
    visibility { "private" }
    association :user

    trait :public do
      visibility { "public" }
    end

    trait :shared do
      visibility { "shared" }
    end

    trait :with_items do
      after(:create) do |list|
        create_list(:item, 3, list: list)
      end
    end
  end
end
