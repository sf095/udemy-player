import { useEffect, useState } from 'react';

export default function ShortcutToast({ message, id }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
  }, [message, id]);

  if (!message && !visible) return null;

  return (
    <div className={`shortcut-toast ${visible ? 'visible' : ''}`}>
      {message}
    </div>
  );
}
