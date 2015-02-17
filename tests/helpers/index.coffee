module.exports =
  loadFixture: (markup) ->
    div = null

    begin: ->
      div = document.createElement 'div'
      div.style = 'display:none'
      div.innerHTML = markup

      document.documentElement.appendChild div

    end: ->
      document.documentElement.removeChild div
