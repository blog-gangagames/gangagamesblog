(function(){
  function formatHeaderDate(){
    try {
      var d = new Date();
      var locale = (typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length)
        ? navigator.languages[0]
        : (typeof navigator !== 'undefined' ? navigator.language : undefined);
      var tz = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : undefined;
      var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      if (tz) opts.timeZone = tz;
      return new Intl.DateTimeFormat(locale, opts).format(d);
    } catch (_) {
      var d2 = new Date();
      var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      return days[d2.getDay()] + ', ' + months[d2.getMonth()] + ' ' + d2.getDate() + ', ' + d2.getFullYear();
    }
  }

  function setHeaderDate(){
    try {
      var el = document.querySelector('.topbar .topbar-text') || document.querySelector('.topbar-text');
      if (el) { el.textContent = formatHeaderDate(); return true; }
    } catch(_){ }
    return false;
  }

  function collectCategoriesFromMegamenu(){
    var sections = [];
    try {
      var cols = document.querySelectorAll('.categories-megamenu .col-megamenu');
      cols.forEach(function(col){
        var titleEl = col.querySelector('.title');
        var title = titleEl ? (titleEl.textContent || '').trim() : '';
        var links = [];
        col.querySelectorAll('ul.list-unstyled li a').forEach(function(a){
          try {
            var href = a.getAttribute('href') || '#';
            var label = (a.textContent || '').trim();
            if (label) { links.push({ label: label, href: href }); }
          } catch(_){ }
        });
        if (links.length) { sections.push({ title: title || 'Categories', links: links }); }
      });
    } catch(_){ }
    if (sections.length) return sections;
    return [
      { title: 'Casino Games', links: [
        { label: 'Online Slots', href: '/category/online-slots/' },
        { label: 'Poker', href: '/category/poker/' },
        { label: 'Roulette', href: '/category/roulette/' },
        { label: 'Blackjack', href: '/category/blackjack/' },
        { label: 'Game Reviews', href: '/category/game-reviews/' },
        { label: 'Strategies & Tips', href: '/category/strategies-tips/' },
      ]},
      { title: 'Sports Betting', links: [
        { label: 'Cricket Betting', href: '/category/cricket-betting/' },
        { label: 'Football Betting', href: '/category/football-betting/' },
        { label: 'Tennis Betting', href: '/category/tennis-betting/' },
        { label: 'Kabaddi Betting', href: '/category/kabaddi-betting/' },
        { label: 'Match Previews & Predictions', href: '/category/match-previews-predictions/' },
        { label: 'Live Betting Strategies', href: '/category/live-betting-strategies/' },
      ]},
      { title: 'More Categories', links: [
        { label: 'How-To Guides', href: '/category/how-to-guides/' },
        { label: 'Responsible Gambling', href: '/category/responsible-gambling/' },
        { label: 'Legal & Regulatory Updates', href: '/category/legal-regulatory-updates/' },
        { label: 'News & Industry Updates', href: '/category/news-industry-updates/' },
        { label: 'Culture & Lifestyle', href: '/category/culture-lifestyle/' },
        { label: 'Tips & Strategies Hub', href: '/category/tips-strategies-hub/' },
        { label: 'FAQs & Beginner Resources', href: '/category/faqs-beginner-resources/' },
      ]}
    ];
  }

  function renderMobileMenu(){
    // Disabled - using static HTML mobile menu instead
    return;
    try {
      var modalBody = document.querySelector('#modal_aside_right .modal-body');
      if (!modalBody) return;

      var sections = collectCategoriesFromMegamenu();
      if (!sections || !sections.length) return;

      var container = document.createElement('div');
      container.className = 'mobile-menu-container';

      var heading = document.createElement('h5');
      heading.className = 'mobile-menu-heading';
      heading.textContent = 'Categories';
      container.appendChild(heading);

      sections.forEach(function(sec){
        var secEl = document.createElement('div');
        secEl.className = 'mobile-menu-section';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mobile-menu-toggle';
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = sec.title;
        secEl.appendChild(btn);

        var list = document.createElement('ul');
        list.className = 'mobile-menu-list';
        list.style.display = 'none';
        (sec.links || []).forEach(function(link){
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.textContent = link.label;
          a.setAttribute('href', link.href || '#');
          li.appendChild(a);
          list.appendChild(li);
        });
        secEl.appendChild(list);

        container.appendChild(secEl);
      });

      var extras = document.createElement('div');
      extras.className = 'mobile-menu-extras';
      extras.innerHTML = '<a class="mobile-menu-link" href="/index.html">Home</a>\n<a class="mobile-menu-link" href="#categories">Categories</a>\n<a class="mobile-menu-link" href="/contact.html">Contact</a>';
      container.appendChild(extras);

      var existingNav = modalBody.querySelector('nav.list-group');
      if (existingNav && existingNav.parentNode) existingNav.parentNode.removeChild(existingNav);
      modalBody.appendChild(container);

      container.querySelectorAll('.mobile-menu-toggle').forEach(function(btn){
        btn.addEventListener('click', function(){
          var expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          var list = btn.nextElementSibling;
          if (list) list.style.display = expanded ? 'none' : 'block';
        });
      });
    } catch(_){ }
  }

  function ensureHeaderDate(){
    if (setHeaderDate()) return;
    var attempts = 0;
    var timer = setInterval(function(){
      attempts++;
      if (setHeaderDate() || attempts > 10) { clearInterval(timer); }
    }, 200);
  }

  document.addEventListener('DOMContentLoaded', function(){
    ensureHeaderDate();
    renderMobileMenu();
    // No link rewrites: keep absolute category and common links
  });
})();