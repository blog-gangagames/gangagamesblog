// Normalize sidebar tag links across pages to correct category routes
// Also remove banned parent tags everywhere
(function () {
  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/#/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Synonym → slug mapping
  var synonymsToSlug = {
    // Core casino
    "casino": "casino-games",
    "casino games": "casino-games",
    "games": "casino-games",
    "game reviews": "game-reviews",
    "reviews": "game-reviews",

    // Specific games
    "poker": "poker",
    "roulette": "roulette",
    "blackjack": "blackjack",
    "online slots": "online-slots",
    "slots": "online-slots",

    // Sports
    "sports betting": "sports-betting",
    "sports": "sports-betting",
    "football": "football-betting",
    "cricket": "cricket-betting",
    "tennis": "tennis-betting",
    "kabaddi": "kabaddi-betting",

    // Promos and loyalty
    "bonuses and promotions": "bonuses-promotions",
    "bonuses": "bonuses-promotions",
    "promotions": "bonuses-promotions",
    "loyalty": "loyalty-vip-programs",
    "vip": "loyalty-vip-programs",

    // Strategy and guides
    "tips": "tips-strategies-hub",
    "strategies": "tips-strategies-hub",
    "tips and strategies": "tips-strategies-hub",
    "how-to": "how-to-guides",
    "how to": "how-to-guides",
    "guides": "how-to-guides",
    "live betting": "live-betting-strategies",
    "live-betting": "live-betting-strategies",
    "previews": "match-previews-predictions",
    "predictions": "match-previews-predictions",
    "match previews": "match-previews-predictions",

    // Info and culture
    "news": "news-industry-updates",
    "industry updates": "news-industry-updates",
    "legal": "legal-regulatory-updates",
    "regulatory": "legal-regulatory-updates",
    "culture": "culture-lifestyle",
    "lifestyle": "culture-lifestyle",
    "faq": "faqs-beginner-resources",
    "faqs": "faqs-beginner-resources",
    "beginner resources": "faqs-beginner-resources",
    "responsible": "responsible-gambling",
    "responsible gambling": "responsible-gambling"
  };

  // Tags to remove from sidebar everywhere
  var bannedTags = {
    'casino games': true,
    'sports betting': true,
    'bonuses promotions': true,
    'bonuses & promotions': true
  };

  function resolveSlug(nameText) {
    var key = normalize(nameText);
    if (synonymsToSlug[key]) return synonymsToSlug[key];
    // Fallback: slugify the normalized text
    return key.replace(/\s+/g, "-");
  }

  function updateLinks(root) {
    var scope = root || document;
    var anchors = scope.querySelectorAll('.blog-tags a');
    anchors.forEach(function (a) {
      var text = a.textContent || a.getAttribute('data-tag') || '';
      var key = normalize(text);
      // Remove banned tags from UI
      if (bannedTags[key]) {
        var li = a.closest('li');
        if (li && li.parentNode) li.parentNode.removeChild(li);
        else if (a.parentNode) a.parentNode.removeChild(a);
        return;
      }
      var slug = resolveSlug(text);
      if (!slug) return;
      var desired = '/category/' + slug;
      var current = a.getAttribute('href') || '#';
      var needsUpdate = current === '#' || !(/^\/category\//i.test(current)) || current.toLowerCase() !== desired.toLowerCase();
      if (needsUpdate) {
        a.setAttribute('href', desired);
      }
    });
  }

  // Initial run
  document.addEventListener('DOMContentLoaded', function () {
    updateLinks(document);
  });

  // Run after full load as well
  window.addEventListener('load', function () {
    updateLinks(document);
  });

  // Watch for dynamically injected tag blocks
  try {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.addedNodes && m.addedNodes.length > 0) {
          updateLinks(document);
          break;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (e) {
    // Silently ignore if MutationObserver is not supported
  }
})();