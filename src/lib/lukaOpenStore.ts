let isOpen = false;
const listeners = new Set<(open: boolean) => void>();

export const setLukaOpen = (open: boolean) => {
  if (isOpen === open) return;
  isOpen = open;
  listeners.forEach((fn) => fn(open));
};

export const getLukaOpen = () => isOpen;

export const subscribeLukaOpen = (fn: (open: boolean) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
