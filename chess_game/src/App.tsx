import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MonixChess from "@/pages/MonixChess";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MonixChess />
    </QueryClientProvider>
  );
}

export default App;
