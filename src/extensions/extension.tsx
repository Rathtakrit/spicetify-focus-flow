(async () => {
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const SHOWN_KEY = 'focus-flow:welcomed';
  if (!Spicetify.LocalStorage.get(SHOWN_KEY)) {
    Spicetify.showNotification('Focus Flow ready — stay in the zone');
    Spicetify.LocalStorage.set(SHOWN_KEY, '1');
  }
})();
