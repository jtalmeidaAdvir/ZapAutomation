import ConnectionStatus from '../ConnectionStatus';

export default function ConnectionStatusExample() {
  return (
    <ConnectionStatus
      isConnected={true}
      authorizedCount={5}
      messagesToday={23}
      lastActivity="Há 2 minutos"
    />
  );
}
