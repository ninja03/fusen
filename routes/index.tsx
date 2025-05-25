import Board from "@/islands/Board.tsx";
import Header from "@/islands/Header.tsx";

export default function Index() {
  return (
    <div class="min-h-screen">
      <Header currentPage="home" />
      <Board />
    </div>
  );
}
