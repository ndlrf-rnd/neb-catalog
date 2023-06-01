export var vueHighlightJS = {};

const MIN_URL_LENGTH = 13;

vueHighlightJS.install = function install(Vue) {
  Vue.directive('highlightjs', {
    deep: true,
    bind: function bind(el, binding) {
      // on first bind, highlight all targets
      const targets = el.querySelectorAll('code');
      let target;

      for (let i = 0; i < targets.length; i += 1) {
        target = targets[i];

        if (typeof binding.value === 'string') {
          // if a value is directly assigned to the directive, use this
          // instead of the element content.
          target.textContent = binding.value;
          hljs.highlightBlock(target);
        }

      }
    },
    componentUpdated: function componentUpdated(el, binding) {
      // after an update, re-fill the content and then highlight
      const targets = el.querySelectorAll('code');
      let target;

      for (let i = 0; i < targets.length; i += 1) {
        target = targets[i];
        if ((typeof binding.value === 'string') && (binding.value.length >= MIN_URL_LENGTH)) {
          target.textContent = binding.value;
          hljs.highlightBlock(target);
          target.style.display = 'none';
          target.querySelectorAll('.hljs-string').forEach(
            (el) => {
              try {
                const urlInput = el.innerText.replace(/^"([^"]+)"$/ui, '$1');
                if (!(urlInput.startsWith('#'))) {
                  if (urlInput.startsWith('/')) {
                    el.innerHTML = `"<a href="${location.origin}#${urlInput}">${urlInput}</a>"`;
                  } else {
                    const url = new URL(urlInput);
                    if (url.origin === location.origin) {
                      el.innerHTML = `"<a href="${url.origin}#${url.pathname}">${urlInput}</a>"`;
                    } else {
                      el.innerHTML = `"<a href="${urlInput}" target="_blank">${urlInput}</a>"`;
                    }
                  }
                }
              } catch (e) {
              }
            },
          );
          target.style.display = 'block';
        }
      }
    },
  });
};

export default vueHighlightJS;
