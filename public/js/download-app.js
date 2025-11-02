(function(){
  function findStayConnectedHeading(container){
    var headings = container.querySelectorAll('h4, h3');
    for (var i=0;i<headings.length;i++){
      var text = headings[i].textContent.trim().toLowerCase();
      if (text.includes('stay connected')) return headings[i];
    }
    return null;
  }

  function buildDownloadBlock(){
    var aside = document.createElement('aside');
    aside.className = 'wrapper__list__article download-app-block';
    aside.innerHTML = [
      '<h4 class="border_section title-blue">Download Our App</h4>',
      '<div class="card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px;">',
      '  <p style="color:#e6e9ef; font-size:14px; margin-bottom:12px;">Get the official GangaGames app for a faster, streamlined experience.</p>',
      '  <button type="button" class="btn btn-primary btn-block" data-toggle="modal" data-target="#downloadAppModal" style="font-weight:600;">Get the App</button>',
      '</div>'
    ].join('');
    return aside;
  }

  function ensureDownloadModal(){
    if (document.getElementById('downloadAppModal')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = (
      '<div id="downloadAppModal" class="modal fade" tabindex="-1" role="dialog" aria-labelledby="downloadAppModalLabel" aria-hidden="true">\n'
      + '  <div class="modal-dialog modal-dialog-centered" role="document" style="max-width: 480px;">\n'
      + '    <div class="modal-content" style="background: #1a1c4a; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; box-shadow: none; overflow: hidden;">\n'
      + '      <div class="modal-header" style="border: none; padding: 24px 24px 0 24px; position: relative;">\n'
      + '        <button type="button" class="close" data-dismiss="modal" aria-label="Close" style="position: absolute; top: 12px; right: 12px; background: rgba(255, 255, 255, 0.1); border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; color: #ffffff; font-size: 14px;">\n'
      + '          <span aria-hidden="true">&times;</span>\n'
      + '        </button>\n'
      + '        <div style="text-align: center; width: 100%;">\n'
      + '          <div style="margin: 0 auto 16px; text-align: center;">\n'
      + '            <img src="images/gangalogo.png" alt="GangaGames" style="height: 44px; width: auto; object-fit: contain;">\n'
      + '          </div>\n'
      + '          <h4 id="downloadAppModalLabel" style="font-weight: 600; font-size: 22px; margin: 0 0 6px 0; color: #ffffff;">Get the GangaGames App</h4>\n'
      + '          <p style="color: #ffffff; font-size: 14px; margin: 0;">Fast, secure, and designed for gamers.</p>\n'
      + '        </div>\n'
      + '      </div>\n'
      + '      <div class="modal-body" style="padding: 24px 24px 28px 24px;">\n'
      + '        <div class="card" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px; padding: 16px; color: #e6e9ef;">\n'
      + '          <p style="margin-bottom: 12px;">Choose your platform and start your download.</p>\n'
      + '          <div class="d-flex flex-column" style="gap: 10px;">\n'
      + '            <a class="btn btn-primary btn-block" href="https://example.com/download" target="_blank" rel="noopener">Download for Windows</a>\n'
      + '            <a class="btn btn-outline-primary btn-block" href="https://example.com/download-android" target="_blank" rel="noopener">Download for Android</a>\n'
      + '          </div>\n'
      + '        </div>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
    var modalRoot = wrapper.firstElementChild;
    if (modalRoot) document.body.appendChild(modalRoot);
  }

  function insertBlock(){
    var sidebars = Array.prototype.slice.call(document.querySelectorAll('.col-lg-4 aside.wrapper__list__article, .popular__news-right, aside.wrapper__list__article'));
    if (!sidebars.length) return;

    var container = sidebars[0].parentElement || sidebars[0];
    var targetHeading = findStayConnectedHeading(container) || findStayConnectedHeading(document);

    var block = buildDownloadBlock();
    if (targetHeading && targetHeading.parentElement){
      targetHeading.parentElement.parentElement.insertBefore(block, targetHeading.parentElement);
    } else {
      var firstAside = document.querySelector('.col-lg-4 aside.wrapper__list__article') || sidebars[0];
      if (firstAside && firstAside.parentElement){
        firstAside.parentElement.insertBefore(block, firstAside);
      }
    }

    ensureDownloadModal();

    var btn = block.querySelector('button[data-target="#downloadAppModal"]');
    if (btn){
      btn.addEventListener('click', function(e){
        var modal = document.getElementById('downloadAppModal');
        if (!modal){
          e.preventDefault();
          try { window.open('https://example.com/download', '_blank'); } catch (err) {}
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBlock);
  } else {
    insertBlock();
  }
})();