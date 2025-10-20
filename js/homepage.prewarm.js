// Prewarm homepage caches with real content so first-time visitors see posts instantly
(function(){
  try {
    function hasCache(key){
      try { var raw = localStorage.getItem(key); if (!raw) return false; var obj = JSON.parse(raw); return !!(obj && obj.data); } catch(_) { return false; }
    }
    function seedCache(key, data){
      if (!hasCache(key)) {
        try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch(_){}
      }
    }
    function mkPost(id, title, mainCat, subCat, img){
      var now = new Date().toISOString();
      return {
        id: id,
        title: title,
        main_category: mainCat,
        subcategory: subCat,
        image_url: img,
        status: 'published',
        created_at: now,
        published_at: now,
        views: Math.floor(500 + Math.random() * 5000)
      };
    }

    // Gaming posts (used for hero + latest gaming)
    var gaming = [
      mkPost('g-101','Top Slots Strategies for Beginners','Gaming','Online Slots','https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'),
      mkPost('g-102','Mastering Blackjack: Odds and Tactics','Gaming','Blackjack','https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'),
      mkPost('g-103','Poker Bluffing: Reading the Table','Gaming','Poker','https://images.unsplash.com/photo-1535223289827-b902d78e2c07?auto=format&fit=crop&w=800&q=80'),
      mkPost('g-104','Roulette Systems: What Actually Works','Gaming','Roulette','https://images.unsplash.com/photo-1514684070672-d3b970b5a54b?auto=format&fit=crop&w=800&q=80'),
      mkPost('g-105','Responsible Gambling: Set Smart Limits','Gaming','Responsible Gambling','https://images.unsplash.com/photo-1525245644141-2214bf4f1b0a?auto=format&fit=crop&w=800&q=80'),
      mkPost('g-106','New Online Slot Releases Worth Trying','Gaming','Game Reviews','https://images.unsplash.com/photo-1545231163-587ef8a8e7f5?auto=format&fit=crop&w=800&q=80')
    ];

    // Sports betting posts (used for sports carousel)
    var sports = [
      mkPost('s-201','Cricket Betting: Read Pitch and Form','Sports Betting','Cricket Betting','https://images.unsplash.com/photo-1518081461900-126a5e284fc3?auto=format&fit=crop&w=800&q=80'),
      mkPost('s-202','Football Accumulators: Risk vs Reward','Sports Betting','Football Betting','https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80'),
      mkPost('s-203','Tennis Live Bets: Momentum Matters','Sports Betting','Tennis Betting','https://images.unsplash.com/photo-1516005223398-19b9d3f1f61a?auto=format&fit=crop&w=800&q=80'),
      mkPost('s-204','Basketball Props: Value in Player Lines','Sports Betting','Basketball Betting','https://images.unsplash.com/photo-1516675302204-4f54f38f98ce?auto=format&fit=crop&w=800&q=80'),
      mkPost('s-205','Responsible Sports Betting Checklist','Sports Betting','Responsible Betting','https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80'),
      mkPost('s-206','Understanding Odds: Decimal vs Fractional','Sports Betting','Betting Guides','https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80')
    ];

    // Popular/news posts (used for dropdown header + popular list)
    var popular = [
      mkPost('p-301','Industry Update: New Casino Licenses','News & Industry Updates','Regulatory','https://images.unsplash.com/photo-1556761175-4b46a572f05b?auto=format&fit=crop&w=800&q=80'),
      mkPost('p-302','Top Casino Bonuses This Week','News & Industry Updates','Promotions','https://images.unsplash.com/photo-1551892589-865f6986946b?auto=format&fit=crop&w=800&q=80'),
      mkPost('p-303','Emerging Trends in Online Poker','News & Industry Updates','Poker','https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=800&q=80'),
      mkPost('p-304','Slots Volatility: What Players Should Know','News & Industry Updates','Slots','https://images.unsplash.com/photo-1560264280-88b6830f3a73?auto=format&fit=crop&w=800&q=80'),
      mkPost('p-305','Sportsbook Integrations Expand Globally','News & Industry Updates','Sports Betting','https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80'),
      mkPost('p-306','Live Dealer Games: Growth and UX','News & Industry Updates','Live Casino','https://images.unsplash.com/photo-1587691595278-5e20fdab3f81?auto=format&fit=crop&w=800&q=80'),
      mkPost('p-307','Crypto Payments in Gambling','News & Industry Updates','Payments','https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'),
      mkPost('p-308','Safer Gambling: Tools and Tips','News & Industry Updates','Responsible Gambling','https://images.unsplash.com/photo-1520975922323-3fa96e8ad02e?auto=format&fit=crop&w=800&q=80')
    ];

    // Culture & Lifestyle
    var culture = [
      mkPost('c-401','Casino Culture: What to Expect','Culture & Lifestyle','Casino Culture','https://images.unsplash.com/photo-1522650639081-24d1938d47a1?auto=format&fit=crop&w=800&q=80'),
      mkPost('c-402','Lifestyle Habits: Balanced Play','Culture & Lifestyle','Lifestyle','https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=800&q=80'),
      mkPost('c-403','Community Stories from Players','Culture & Lifestyle','Community','https://images.unsplash.com/photo-1536162700113-5f40125044ec?auto=format&fit=crop&w=800&q=80')
    ];

    // Tips & Strategies
    var tips = [
      mkPost('t-501','Slots Bankroll: Smart Staking Plans','Tips & Strategies','Slots Tips','https://images.unsplash.com/photo-1554774853-bf3c30fa3c09?auto=format&fit=crop&w=800&q=80'),
      mkPost('t-502','Poker Study Routine: Weekly Focus','Tips & Strategies','Poker Tips','https://images.unsplash.com/photo-1512427691650-1f3c85e28fef?auto=format&fit=crop&w=800&q=80'),
      mkPost('t-503','Roulette Odds: Myths vs Reality','Tips & Strategies','Roulette Tips','https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=800&q=80'),
      mkPost('t-504','Blackjack Charts: Memorization Guide','Tips & Strategies','Blackjack Tips','https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'),
      mkPost('t-505','Sports Models: Basics for Beginners','Tips & Strategies','Sports Models','https://images.unsplash.com/photo-1553729784-e0341df46f43?auto=format&fit=crop&w=800&q=80'),
      mkPost('t-506','Safer Play: Time and Loss Limits','Tips & Strategies','Responsible Play','https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=800&q=80')
    ];

    // Sidebar latest (mix)
    var sidebar = [popular[0], gaming[1], sports[2], popular[3], gaming[4], sports[5]];

    // Seed critical sections for instant paint
    seedCache('home:hero-header', gaming.slice(0, 4));
    seedCache('home:hero-right', gaming.slice(1, 4));
    seedCache('home:popular-header', popular.slice(0, 8));
    seedCache('home:trending', popular.concat(gaming).slice(0, 9));
    seedCache('home:latest-gaming', gaming);
    seedCache('home:sports-carousel', sports);

    // Seed secondary sections to avoid any loading gaps
    seedCache('home:popular-list', popular.slice(0, 6));
    seedCache('home:culture-lifestyle', culture);
    seedCache('home:tips-strategies', tips);
    seedCache('home:latest-sidebar', sidebar);

    // Done
    console.log('[prewarm] Homepage caches seeded for instant content.');
  } catch(e){ console.warn('[prewarm] failed:', e); }
})();