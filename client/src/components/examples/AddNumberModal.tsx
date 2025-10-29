import AddNumberModal from '../AddNumberModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function AddNumberModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Abrir Modal</Button>
      <AddNumberModal
        open={open}
        onOpenChange={setOpen}
        onAdd={(phone, label) => console.log('Add number:', phone, label)}
      />
    </div>
  );
}
