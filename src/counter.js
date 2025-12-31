export function setupCounter(element) {
  let counter = 0;
  const setCounter = (count) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };

  element.addEventListener('click', () => {

      console.log({ GM_cookie, unsafeWindow, GM_addElement, GM_registerMenuCommand,  });

      setCounter(++counter)
  });
  setCounter(0);
}
