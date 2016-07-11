$('.logs').each(function () {
  var updating = false, newest_time = ''
  var ids = [], oldest_time = ''

  function element_in_scroll(elem)
  {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height() + 800;

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  }

  $(document).scroll(function(e){
    if (element_in_scroll(".logs-end")) {
      backfill()
    }
  })

  function backfill () {
    if (updating) return
    updating = true
    $.getJSON('/logs?oldest_time=' + oldest_time, function (data) {
      updating = false
      if (!data.logs || !data.logs.length) {
        return
      }
      var delay = 0
      data.logs.forEach(function (log) {
        if (ids.indexOf(log.id) !== -1) return
        if (!newest_time) {
          newest_time = log.time
          updateTitle(log)
        }
        var $el = $('<div class="log-line" style="display:none">' + log.html + getPermalink(log) + '</div>')
        if (log.data && log.data.new_max_vol) {
          $el.addClass(log.data.zmi.indexOf('BULL') > 0 ? 'bull' : 'bear')
        }
        $('.logs').append($el)
        setTimeout(function () {
          $el.fadeIn('slow')
        }, delay)
        delay += 10
        ids.push(log.id)
        oldest_time = log.time
      })
    })
  }

  document.title = document.title.replace(/.+ \- /, '')
  var orig_title = document.title
  function updateTitle (log) {
    if (log.data && log.data.zmi) {
      if (log.data && log.data.new_max_vol) {
        log.data.zmi = log.data.zmi.replace('/', '*/')
        var orig_zmi = log.data.zmi
        var blink_on = false
        var blinks = 6
        ;(function blink () {
          setTimeout(function () {
            if (blink_on) {
              document.title = ''
            }
            else {
              document.title = orig_zmi + ' - ' + log.data.price + ' ' + orig_title
            }
            blink_on = !blink_on
            if (blinks--) blink()
          }, 400)
        })()
      }
      document.title = log.data.zmi + ' - ' + log.data.price + ' ' + orig_title
    }
  }

  function getPermalink (log) {
    return ' <small><a class="permalink" target="_blank" href="#oldest_time__' + (log.time + 1) + '">[link]</a></small>'
  }

  function poll () {
    if (updating) return
    updating = true
    $.getJSON('/logs?newest_time=' + newest_time, function (data) {
      updating = false
      var delay = 0
      var $old_el = $('.log-line').eq(0)
      data.logs.reverse().forEach(function (log, idx) {
        if (ids.indexOf(log.id) !== -1) return
        $('.logs .first').removeClass('first')
        var $el = $('<div class="log-line first" style="visibility:hidden" id="oldest_time__' + (log.time + 1) + '">' + log.html + getPermalink(log) + '</div>')
        $('.logs').prepend($el)
        setTimeout(function () {
          $el.fadeIn('slow')
        }, delay)
        delay += 10
        ids.push(log.id)
        updateTitle(log)
        if (log.data && log.data.new_max_vol) {
          $el.addClass(log.data.zmi.indexOf('BULL') > 0 ? 'bull' : 'bear')
        }
        newest_time = log.time
      })
      if (data.logs.length > 10 && $old_el) {
        $('html, body').scrollTop($old_el.offset().top)
      }
    })
  }

  function onHash () {
    $('.logs').empty()
    var match = window.location.hash.match(/oldest_time=([^,]+)/)
    if (match) {
      oldest_time = parseInt(match[1], 10)
    }
    newest_time = oldest_time
    backfill()
  }

  onHash()
  backfill()
  $(window).on('hashchange', onHash)
  setInterval(poll, 10000)
})