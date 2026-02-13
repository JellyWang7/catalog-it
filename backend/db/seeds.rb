# Clear existing data
puts "Clearing existing data..."
Item.destroy_all
List.destroy_all
User.destroy_all

# ───────────────────────────────────────────
# USERS
# ───────────────────────────────────────────
puts "Creating users..."

admin = User.create!(
  username: "admin",
  email: "admin@catalogit.com",
  password: "password123",
  role: "admin",
  status: "active"
)

user1 = User.create!(
  username: "movie_buff",
  email: "movies@example.com",
  password: "password123",
  role: "user",
  status: "active"
)

user2 = User.create!(
  username: "bookworm",
  email: "books@example.com",
  password: "password123",
  role: "user",
  status: "active"
)

user3 = User.create!(
  username: "collector",
  email: "collector@example.com",
  password: "password123",
  role: "user",
  status: "active"
)

suspended_user = User.create!(
  username: "banned_user",
  email: "banned@example.com",
  password: "password123",
  role: "user",
  status: "suspended"
)

# ───────────────────────────────────────────
# PUBLIC LISTS
# ───────────────────────────────────────────
puts "Creating public lists..."

sci_fi = List.create!(
  title: "Must-Watch Sci-Fi Movies",
  description: "A curated collection of the best science fiction films of all time",
  visibility: "public",
  user: user1
)

[
  { name: "The Matrix", category: "Sci-Fi", notes: "Mind-bending reality questioning", rating: 5 },
  { name: "Inception", category: "Sci-Fi", notes: "Dreams within dreams", rating: 5 },
  { name: "Blade Runner 2049", category: "Sci-Fi", notes: "Stunning visuals and deep themes", rating: 5 },
  { name: "Interstellar", category: "Sci-Fi", notes: "Space exploration and time dilation", rating: 4 },
  { name: "Ex Machina", category: "Sci-Fi", notes: "AI consciousness exploration", rating: 4 },
  { name: "Arrival", category: "Sci-Fi", notes: "Linguistics meets first contact", rating: 4 },
  { name: "Tenet", category: "Sci-Fi", notes: "Time inversion thriller", rating: 3 },
  { name: "The Cloverfield Paradox", category: "Sci-Fi", notes: "Interesting concept, weak execution", rating: 2 },
].each { |d| sci_fi.items.create!(d) }

comedies = List.create!(
  title: "Classic Comedy Collection",
  description: "Timeless comedies that never get old",
  visibility: "public",
  user: user1
)

[
  { name: "The Grand Budapest Hotel", category: "Comedy", notes: "Wes Anderson masterpiece", rating: 5 },
  { name: "Superbad", category: "Comedy", notes: "High school comedy gold", rating: 4 },
  { name: "Groundhog Day", category: "Comedy", notes: "Time loop classic", rating: 5 },
  { name: "The Big Lebowski", category: "Comedy", notes: "The Dude abides", rating: 4 },
].each { |d| comedies.items.create!(d) }

fantasy = List.create!(
  title: "Essential Fantasy Novels",
  description: "Epic fantasy books that transport you to other worlds",
  visibility: "public",
  user: user2
)

[
  { name: "The Name of the Wind", category: "Fantasy", notes: "Patrick Rothfuss - magical storytelling", rating: 5 },
  { name: "The Way of Kings", category: "Fantasy", notes: "Brandon Sanderson's epic", rating: 5 },
  { name: "The Hobbit", category: "Fantasy", notes: "Tolkien's classic adventure", rating: 5 },
  { name: "Mistborn: The Final Empire", category: "Fantasy", notes: "Unique magic system", rating: 4 },
  { name: "The Fifth Season", category: "Fantasy", notes: "N.K. Jemisin's powerful world", rating: 5 },
  { name: "A Wizard of Earthsea", category: "Fantasy", notes: "Ursula K. Le Guin's coming-of-age tale", rating: nil },
].each { |d| fantasy.items.create!(d) }

tech_books = List.create!(
  title: "Tech & Innovation Reads",
  description: "Books about technology, startups, and innovation",
  visibility: "public",
  user: user2
)

[
  { name: "The Lean Startup", category: "Business", notes: "Eric Ries - startup methodology", rating: 4 },
  { name: "Zero to One", category: "Business", notes: "Peter Thiel on innovation", rating: 5 },
  { name: "The Innovator's Dilemma", category: "Business", notes: "Clayton Christensen classic", rating: 4 },
  { name: "Clean Code", category: "Programming", notes: "Robert C. Martin - software craftsmanship", rating: 5 },
  { name: "Designing Data-Intensive Applications", category: "Programming", notes: "Martin Kleppmann - must-read for backend devs", rating: 5 },
].each { |d| tech_books.items.create!(d) }

retro_games = List.create!(
  title: "Vintage Video Game Collection",
  description: "My prized collection of retro gaming consoles and games",
  visibility: "public",
  user: user3
)

[
  { name: "Nintendo Entertainment System", category: "Console", notes: "Original 1985 model with box", rating: 5 },
  { name: "Super Mario Bros 3", category: "Game", notes: "Complete in box, mint condition", rating: 5 },
  { name: "Sega Genesis", category: "Console", notes: "Model 1 with Sonic the Hedgehog", rating: 4 },
  { name: "Legend of Zelda Gold Cartridge", category: "Game", notes: "First edition NES", rating: 5 },
  { name: "Game Boy Color", category: "Handheld", notes: "Atomic Purple limited edition", rating: 4 },
  { name: "Atari 2600", category: "Console", notes: "Working condition, some cosmetic wear", rating: 3 },
  { name: "Pac-Man Arcade Cabinet", category: "Arcade", notes: "Quarter-scale replica", rating: nil },
].each { |d| retro_games.items.create!(d) }

music = List.create!(
  title: "Top Albums of 2025",
  description: "My favorite music releases from last year",
  visibility: "public",
  user: user3
)

[
  { name: "Brat - Charli XCX", category: "Pop", notes: "Genre-defining hyperpop album", rating: 5 },
  { name: "GNX - Kendrick Lamar", category: "Hip-Hop", notes: "Lyrical masterclass", rating: 5 },
  { name: "Hit Me Hard and Soft - Billie Eilish", category: "Alt-Pop", notes: "Intimate and cinematic", rating: 4 },
  { name: "Cowboy Carter - Beyonce", category: "Country", notes: "Bold genre experiment", rating: 4 },
  { name: "The Tortured Poets Department - Taylor Swift", category: "Pop", notes: "Confessional songwriting", rating: 3 },
].each { |d| music.items.create!(d) }

# ───────────────────────────────────────────
# SHARED LIST
# ───────────────────────────────────────────
puts "Creating shared list..."

recipes = List.create!(
  title: "Team Lunch Recipes",
  description: "Our office's favorite lunch recipes to share",
  visibility: "shared",
  user: admin
)

[
  { name: "Thai Green Curry", category: "Asian", notes: "Use fresh basil and coconut milk", rating: 5 },
  { name: "Caesar Salad", category: "Salad", notes: "Homemade croutons are key", rating: 4 },
  { name: "Margherita Pizza", category: "Italian", notes: "Simple but perfect", rating: 5 },
].each { |d| recipes.items.create!(d) }

# ───────────────────────────────────────────
# PRIVATE LISTS (with items for demo)
# ───────────────────────────────────────────
puts "Creating private lists..."

goals = List.create!(
  title: "Personal Goals 2026",
  description: "My private goals and aspirations for the year",
  visibility: "private",
  user: user1
)

[
  { name: "Read 24 books", category: "Reading", notes: "2 per month target", rating: nil },
  { name: "Learn Rust", category: "Programming", notes: "Complete the Rust book by June", rating: nil },
  { name: "Run a half marathon", category: "Fitness", notes: "Training plan starts March", rating: nil },
  { name: "Build a side project", category: "Career", notes: "Ship something on Product Hunt", rating: nil },
].each { |d| goals.items.create!(d) }

wishlist = List.create!(
  title: "Birthday Wishlist",
  description: "Things I'd love to receive",
  visibility: "private",
  user: user2
)

[
  { name: "Kindle Paperwhite", category: "Electronics", notes: "The latest model with warm light", rating: 5 },
  { name: "Lego Architecture Set", category: "Toys", notes: "The Guggenheim Museum one", rating: 4 },
  { name: "Cast Iron Skillet", category: "Kitchen", notes: "Lodge 12-inch", rating: nil },
].each { |d| wishlist.items.create!(d) }

puts ""
puts "Seed data created successfully!"
puts "Summary:"
puts "  - #{User.count} users (#{User.where(role: 'admin').count} admin, #{User.where(status: 'suspended').count} suspended)"
puts "  - #{List.count} lists (#{List.where(visibility: 'public').count} public, #{List.where(visibility: 'shared').count} shared, #{List.where(visibility: 'private').count} private)"
puts "  - #{Item.count} items"
puts ""
puts "Login credentials:"
puts "  Admin:      admin@catalogit.com / password123"
puts "  Movie Buff: movies@example.com / password123"
puts "  Bookworm:   books@example.com / password123"
puts "  Collector:  collector@example.com / password123"
puts "  (Suspended): banned@example.com / password123"
