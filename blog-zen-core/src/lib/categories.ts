export const CATEGORY_TREE: Record<string, string[]> = {
  "Casino Games": [
    "Online Slots",
    "Poker",
    "Roulette",
    "Blackjack",
    "Game Reviews",
    "Strategies & Tips",
  ],
  "Sports Betting": [
    "Cricket Betting",
    "Football Betting",
    "Kabaddi Betting",
    "Tennis Betting",
    "Live Betting Strategies",
    "Match Previews & Predictions",
  ],
  "Bonuses & Promotions": [
    "Casino Bonuses",
    "Sportsbook Promotions",
    "Loyalty & VIP Programs",
    "Tips to Maximize Bonuses",
  ],
  "More Categories": [
    "How-To Guides",
    "Responsible Gambling",
    "Legal & Regulatory Updates",
    "News & Industry Updates",
    "Culture & Lifestyle",
    "Tips & Strategies Hub",
    "FAQs & Beginner Resources",
  ],
};

export const MAIN_CATEGORIES = Object.keys(CATEGORY_TREE);
export const SUBCATEGORIES: Record<string, string[]> = CATEGORY_TREE;
export const ALL_SUBCATEGORIES = MAIN_CATEGORIES.flatMap((m) => CATEGORY_TREE[m]);