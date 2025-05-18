// hooks/useGlobalUnread.js

import { useState } from 'react';

let _setUnreadCount;
let _unreadCount = 0;

export function setGlobalUnreadCount(val) {
  _unreadCount = val;
  if (_setUnreadCount) _setUnreadCount(val);
}

export function useGlobalUnread() {
  const [unreadCount, setUnreadCount] = useState(_unreadCount);
  _setUnreadCount = setUnreadCount;
  return unreadCount;
}
