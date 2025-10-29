import AuthorizedNumbers from '../AuthorizedNumbers';

export default function AuthorizedNumbersExample() {
  const mockNumbers = [
    { id: '1', phone: '+351912345678', label: 'João Silva', dateAdded: '29/10/2025' },
    { id: '2', phone: '+351923456789', label: 'Maria Santos', dateAdded: '28/10/2025' },
    { id: '3', phone: '+351934567890', label: 'Pedro Costa', dateAdded: '27/10/2025' },
  ];

  return (
    <AuthorizedNumbers
      numbers={mockNumbers}
      onAdd={() => console.log('Add number clicked')}
      onDelete={(id) => console.log('Delete number:', id)}
    />
  );
}
