import { useState } from 'react';
import AddTransactionModal from './AddTransactionModal';

export default function FloatingAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="fab" onClick={() => setOpen(true)} aria-label="Add transaction">
        +
      </button>
      {open && <AddTransactionModal onClose={() => setOpen(false)} />}
    </>
  );
}
