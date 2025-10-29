import MessageLog from '../MessageLog';

export default function MessageLogExample() {
  const mockMessages = [
    {
      id: '1',
      phone: '+351912345678',
      content: 'Olá, gostaria de mais informações sobre seus serviços.',
      timestamp: 'Há 5 min',
      direction: 'received' as const,
    },
    {
      id: '2',
      phone: '+351912345678',
      content: 'Obrigado pela sua mensagem! Em breve entraremos em contato.',
      timestamp: 'Há 5 min',
      direction: 'sent' as const,
    },
    {
      id: '3',
      phone: '+351923456789',
      content: 'Qual é o horário de funcionamento?',
      timestamp: 'Há 15 min',
      direction: 'received' as const,
    },
    {
      id: '4',
      phone: '+351923456789',
      content: 'Nosso horário é de segunda a sexta, das 9h às 18h.',
      timestamp: 'Há 14 min',
      direction: 'sent' as const,
    },
  ];

  return <MessageLog messages={mockMessages} />;
}
